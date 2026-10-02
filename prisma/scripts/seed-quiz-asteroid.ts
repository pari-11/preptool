import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Prisma, PrismaClient, type QuizCategory } from '@prisma/client';
import { describeLines, resolveHighlight, unresolvedSpecs } from '../../lib/quizHighlight';
import { APPROACH_NAME, LEETCODE_ID, QUESTIONS, USER_CODE } from '../quiz-seeds/asteroid-collision';
import { EXPLANATIONS } from '../quiz-seeds/asteroid-collision-explanations';
import { HIGHLIGHTS } from '../quiz-seeds/asteroid-collision-highlights';

// Spec 011 first slice: stores the user's hand-written asteroid-collision quiz (LC 735) under a
// "Stack (your solution)" approach. Re-runnable/idempotent like the import scripts: a question is
// matched by its stable source_key, and a re-run never touches a question that is no longer
// origin = Seeded (i.e. one the user edited). Seeded questions that are no longer in the data file
// are removed, which is how a disliked pattern is dropped for good: delete it from the file, re-run.
//
//   npx --yes tsx prisma/scripts/seed-quiz-asteroid.ts               seed the database in .env
//   npx --yes tsx prisma/scripts/seed-quiz-asteroid.ts --check-only  only run the C++ answer checks
//
// DATABASE_URL in the environment overrides .env, so this can be pointed at a scratch database.

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
// check passed. Throws if any check fails (a wrong key) or if the compiler is missing/broken
// in a way other than "g++ isn't installed", in which case nothing is marked verified.
function runChecks(): Set<string> | null {
  const withChecks = QUESTIONS.filter((q) => q.check);
  const dir = mkdtempSync(join(tmpdir(), 'quiz-check-'));
  try {
    const src = join(dir, 'check.cpp');
    const exe = join(dir, process.platform === 'win32' ? 'check.exe' : 'check');
    writeFileSync(
      src,
      [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        USER_CODE,
        'int main() {',
        '  string line;',
        '  while (getline(cin, line)) {',
        '    istringstream is(line); vector<int> v; int x;',
        '    while (is >> x) v.push_back(x);',
        '    Solution s; vector<int> r = s.asteroidCollision(v);',
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
      throw new Error(`The user's C++ failed to compile:\n${String((e as { stderr?: Buffer }).stderr ?? e)}`);
    }
    const input = withChecks.map((q) => q.check!.input.join(' ')).join('\n') + '\n';
    const out = execFileSync(exe, { input, stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .replace(/\r/g, '')
      .split('\n');
    const verified = new Set<string>();
    const failures: string[] = [];
    withChecks.forEach((q, i) => {
      const got = out[i];
      const want = q.check!.expect.join(' ');
      if (got === want) verified.add(q.key);
      else failures.push(`${q.key}: [${q.check!.input}] -> got "[${got}]", the key assumes "[${want}]"`);
    });
    if (failures.length) throw new Error(`Answer key does not match the real code:\n  ${failures.join('\n  ')}`);
    return verified;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  // Shape checks on the data itself, before anything is compiled or written.
  const keys = new Set<string>();
  for (const q of QUESTIONS) {
    if (keys.has(q.key)) throw new Error(`Duplicate key ${q.key}`);
    keys.add(q.key);
    if (q.options.length !== 4 || new Set(q.options).size !== 4) throw new Error(`${q.key}: needs 4 distinct options`);
  }
  // Every question needs an explanation, and an explanation for a question that no longer exists
  // means a question was dropped from one file but not the other.
  const missing = QUESTIONS.filter((q) => !EXPLANATIONS[q.key]).map((q) => q.key);
  const orphaned = Object.keys(EXPLANATIONS).filter((k) => !keys.has(k));
  if (missing.length) throw new Error(`No explanation for: ${missing.join(', ')}`);
  if (orphaned.length) throw new Error(`Explanation without a question: ${orphaned.join(', ')}`);
  // Highlights are optional per question, but every one that exists must point at real lines of the
  // code (a spec that matches nothing means the code or the spec drifted), and must belong to a
  // question that still exists. What each resolves to is printed so a wrong match is visible.
  const highlightOrphans = Object.keys(HIGHLIGHTS).filter((k) => !keys.has(k));
  if (highlightOrphans.length) throw new Error(`Highlight without a question: ${highlightOrphans.join(', ')}`);
  const lineCount = USER_CODE.split(String.fromCharCode(10)).length;
  for (const q of QUESTIONS) {
    const specs = HIGHLIGHTS[q.key];
    if (!specs) continue;
    const bad = unresolvedSpecs(USER_CODE, specs);
    if (bad.length) throw new Error(`${q.key}: highlight matches nothing in the code: ${JSON.stringify(bad)}`);
    const lines = resolveHighlight(USER_CODE, specs);
    if (lines.length === 0 || lines.some((i) => i >= lineCount)) throw new Error(`${q.key}: bad highlight`);
    console.log(`  highlight ${q.key.padEnd(7)} -> lines ${describeLines(lines)}`);
  }
  const bySet = (s: string) => QUESTIONS.filter((q) => q.set === s).length;
  console.log(`${QUESTIONS.length} questions (set-1: ${bySet('set-1')}, set-2: ${bySet('set-2')}, added: ${bySet('added')})`);

  const verified = runChecks();
  if (verified === null) {
    console.log('g++ not found: no question will be marked verified.');
  } else {
    console.log(`C++ check: ${verified.size} of ${QUESTIONS.filter((q) => q.check).length} answer keys match the real code.`);
  }
  if (process.argv.includes('--check-only')) return;

  const problem = await prisma.problem.findUnique({ where: { leetcode_id: LEETCODE_ID } });
  if (!problem) throw new Error(`No problem with leetcode_id ${LEETCODE_ID} in this database.`);

  const approach = await prisma.quizApproach.upsert({
    where: { problem_id_name: { problem_id: problem.id, name: APPROACH_NAME } },
    update: { code: USER_CODE },
    create: { problem_id: problem.id, name: APPROACH_NAME, origin: 'User', code: USER_CODE, position: 0 },
  });

  // Order: easiest to hardest by category, then the order in the data file (the user's two sets
  // as written, then anything added later), so a related "what is" / "why" pair stays together.
  const ordered = QUESTIONS.map((q, index) => ({ q, index })).sort(
    (a, b) => CATEGORY_RANK[a.q.category] - CATEGORY_RANK[b.q.category] || a.index - b.index
  );

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
      explanation: EXPLANATIONS[q.key],
      highlight: HIGHLIGHTS[q.key] ?? Prisma.DbNull,
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
    `LC ${LEETCODE_ID} "${APPROACH_NAME}": ${created} created, ${updated} updated, ${skipped} left alone (edited), ${pruned.count} pruned. ${total} questions now stored.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
