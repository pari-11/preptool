import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Prisma, PrismaClient, type QuizCategory } from '@prisma/client';
import { describeLines, resolveHighlight, unresolvedSpecs } from '../../lib/quizHighlight';
import type { QuizSeed } from '../quiz-seeds/types';

// Spec 011: stores one problem's quiz from a seed file in prisma/quiz-seeds/ under a
// "(your solution)" approach holding the user's own code. Re-runnable/idempotent like the import
// scripts: a question is matched by its stable source_key, and a re-run never touches a question
// that is no longer origin = Seeded (i.e. one the user edited). Seeded questions that are no
// longer in the seed are removed, which is how a disliked question or pattern is dropped for good:
// delete it from the seed files, re-run.
//
//   npx --yes tsx prisma/scripts/seed-quiz.ts <seed>               seed the database in .env
//   npx --yes tsx prisma/scripts/seed-quiz.ts <seed> --check-only  only run the C++ answer checks
//
// DATABASE_URL in the environment overrides .env, so this can be pointed at a scratch database.
// A new problem is a new seed file plus one line in SEEDS below.

const SEEDS: Record<string, () => Promise<{ SEED: QuizSeed }>> = {
  'asteroid-collision': () => import('../quiz-seeds/asteroid-collision-seed'),
  'daily-temperatures': () => import('../quiz-seeds/daily-temperatures-seed'),
};

const prisma = new PrismaClient();

// Easiest to hardest, per docs/quiz-question-patterns.md: intuition and single-line code reading
// first, then tracing and edge cases, then complexity and counterfactuals, then the final block.
const CATEGORY_RANK: Record<QuizCategory, number> = {
  Intuition: 1,
  CodeReading: 2,
  Tracing: 3,
  EdgeCase: 3,
  Complexity: 4,
  Counterfactual: 4,
  FinalUnderstanding: 5,
};

// Runs the user's real C++ on every check input and returns the keys of the questions whose
// check passed. Checks with a `variant` run a changed copy of the code (compiled separately).
// Throws if any check fails (a wrong key) or the code does not compile; returns null when g++
// is not installed, in which case nothing is marked verified.
function runChecks(seed: QuizSeed): Set<string> | null {
  const withChecks = seed.questions.filter((q) => q.check);
  const groups = new Map<string, typeof withChecks>();
  for (const q of withChecks) {
    const key = q.check!.variant ? JSON.stringify(q.check!.variant) : '';
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }

  const dir = mkdtempSync(join(tmpdir(), 'quiz-check-'));
  const verified = new Set<string>();
  const failures: string[] = [];
  try {
    let n = 0;
    for (const [variantKey, qs] of groups) {
      let code = seed.code;
      if (variantKey) {
        const v = qs[0].check!.variant!;
        const found = code.split(v.replace).length - 1;
        if (found !== 1) throw new Error(`A variant's text must appear exactly once in the code (found ${found}): ${v.replace}`);
        code = code.replace(v.replace, () => v.with);
      }
      const src = join(dir, `check${n}.cpp`);
      const exe = join(dir, `check${n}${process.platform === 'win32' ? '.exe' : ''}`);
      n++;
      writeFileSync(
        src,
        [
          '#include <bits/stdc++.h>',
          'using namespace std;',
          code,
          'int main() {',
          '  string line;',
          '  while (getline(cin, line)) {',
          '    istringstream is(line); vector<int> v; int x;',
          '    while (is >> x) v.push_back(x);',
          `    Solution s; vector<int> r = s.${seed.functionName}(v);`,
          '    for (size_t i = 0; i < r.size(); i++) { if (i) cout << " "; cout << r[i]; }',
          '    cout << "\\n";',
          '  }',
          '}',
        ].join('\n')
      );
      try {
        execFileSync('g++', ['-std=c++17', '-O0', '-o', exe, src], { stdio: 'pipe' });
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') return null; // no g++ on this machine
        throw new Error(`The C++ failed to compile:\n${String((e as { stderr?: Buffer }).stderr ?? e)}`);
      }
      const input = qs.map((q) => q.check!.input.join(' ')).join('\n') + '\n';
      const out = execFileSync(exe, { input, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString()
        .replace(/\r/g, '')
        .split('\n');
      qs.forEach((q, i) => {
        const got = out[i];
        const want = q.check!.expect.join(' ');
        const label = variantKey ? ' (changed code)' : '';
        if (got === want) verified.add(q.key);
        else failures.push(`${q.key}${label}: [${q.check!.input}] -> got "[${got}]", the key assumes "[${want}]"`);
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (failures.length) throw new Error(`Answer key does not match the real code:\n  ${failures.join('\n  ')}`);
  return verified;
}

async function main() {
  const name = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!name || !SEEDS[name]) {
    console.error(`Usage: seed-quiz.ts <seed> [--check-only]\nSeeds: ${Object.keys(SEEDS).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const { SEED: seed } = await SEEDS[name]();
  const { questions, explanations, highlights } = seed;
  console.log(`Seed: ${name} (LC ${seed.leetcodeId}, "${seed.approachName}")`);

  // Shape checks on the data itself, before anything is compiled or written.
  const keys = new Set<string>();
  for (const q of questions) {
    if (keys.has(q.key)) throw new Error(`Duplicate key ${q.key}`);
    keys.add(q.key);
    if (q.options.length !== 4 || new Set(q.options).size !== 4) throw new Error(`${q.key}: needs 4 distinct options`);
  }

  // Every question needs an explanation, and an explanation for a question that no longer exists
  // means a question was dropped from one file but not the other.
  const missing = questions.filter((q) => !explanations[q.key]).map((q) => q.key);
  const orphaned = Object.keys(explanations).filter((k) => !keys.has(k));
  if (missing.length) throw new Error(`No explanation for: ${missing.join(', ')}`);
  if (orphaned.length) throw new Error(`Explanation without a question: ${orphaned.join(', ')}`);

  // Highlights are optional per question, but every one that exists must point at real lines of the
  // code (a spec that matches nothing means the code or the spec drifted), and must belong to a
  // question that still exists. What each resolves to is printed so a wrong match is visible.
  const highlightOrphans = Object.keys(highlights).filter((k) => !keys.has(k));
  if (highlightOrphans.length) throw new Error(`Highlight without a question: ${highlightOrphans.join(', ')}`);
  const lineCount = seed.code.split(String.fromCharCode(10)).length;
  for (const q of questions) {
    const specs = highlights[q.key];
    if (!specs) continue;
    const bad = unresolvedSpecs(seed.code, specs);
    if (bad.length) throw new Error(`${q.key}: highlight matches nothing in the code: ${JSON.stringify(bad)}`);
    const lines = resolveHighlight(seed.code, specs);
    if (lines.length === 0 || lines.some((i) => i >= lineCount)) throw new Error(`${q.key}: bad highlight`);
    console.log(`  highlight ${q.key.padEnd(8)} -> lines ${describeLines(lines)}`);
  }

  const labels = new Map<string, number>();
  for (const q of questions) labels.set(q.set, (labels.get(q.set) ?? 0) + 1);
  console.log(`${questions.length} questions (${[...labels].map(([k, v]) => `${k}: ${v}`).join(', ')})`);

  const verified = runChecks(seed);
  if (verified === null) {
    console.log('g++ not found: no question will be marked verified.');
  } else {
    console.log(`C++ check: ${verified.size} of ${questions.filter((q) => q.check).length} answer keys match the real code.`);
  }
  if (process.argv.includes('--check-only')) return;

  const problem = await prisma.problem.findUnique({ where: { leetcode_id: seed.leetcodeId } });
  if (!problem) throw new Error(`No problem with leetcode_id ${seed.leetcodeId} in this database.`);

  const approach = await prisma.quizApproach.upsert({
    where: { problem_id_name: { problem_id: problem.id, name: seed.approachName } },
    update: { code: seed.code },
    create: { problem_id: problem.id, name: seed.approachName, origin: 'User', code: seed.code, position: 0 },
  });

  // Order: easiest to hardest by category, then the order in the seed file, so a related
  // "what is" / "why" pair stays together.
  const ordered = questions
    .map((q, index) => ({ q, index }))
    .sort((a, b) => CATEGORY_RANK[a.q.category] - CATEGORY_RANK[b.q.category] || a.index - b.index);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const [i, { q }] of ordered.entries()) {
    const data = {
      set_label: q.set,
      category: q.category as QuizCategory,
      position: i + 1,
      text: q.text,
      snippet: q.snippet ?? null,
      options: q.options,
      correct_index: q.correct,
      explanation: explanations[q.key],
      highlight: highlights[q.key] ?? Prisma.DbNull,
      verified: verified?.has(q.key) ?? false,
    };
    const existing = await prisma.quizQuestion.findUnique({
      where: { approach_id_source_key: { approach_id: approach.id, source_key: q.key } },
    });
    if (!existing) {
      await prisma.quizQuestion.create({ data: { approach_id: approach.id, source_key: q.key, origin: 'Seeded', ...data } });
      created++;
    } else if (existing.origin !== 'Seeded') {
      skipped++;
    } else {
      await prisma.quizQuestion.update({ where: { id: existing.id }, data });
      updated++;
    }
  }

  const pruned = await prisma.quizQuestion.deleteMany({
    where: { approach_id: approach.id, origin: 'Seeded', source_key: { notIn: [...keys] } },
  });
  const total = await prisma.quizQuestion.count({ where: { approach_id: approach.id } });
  console.log(
    `LC ${seed.leetcodeId} "${seed.approachName}": ${created} created, ${updated} updated, ${skipped} left alone (edited), ${pruned.count} pruned. ${total} questions now stored.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
