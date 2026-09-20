import { PrismaClient, Tier } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const DATA_DIR = join(__dirname, '..', '..', 'data');
const FILES = ['roadmap-stage-0-7.md', 'roadmap-stage-8-plus.md'];
const NOTES_HEADING = 'Notes on choices made in this draft';
const NOTES_RESOURCE_TITLE = 'Roadmap Draft — Notes on Choices (Stage 8+)';

interface ParsedProblem {
  leetcodeId: number;
  title: string;
  tier: Tier | null;
  isPriority: boolean;
  isPremium: boolean;
  note: string | null;
}

interface ParsedStage {
  label: string;
  title: string;
  insightNote: string;
  isBridge: boolean;
  problems: ParsedProblem[];
}

interface ParsedFile {
  stages: ParsedStage[];
  notes: string | null;
}

function parseProblemLine(raw: string): ParsedProblem {
  let line = raw;

  let note: string | null = null;
  const noteMatch = /\s+\*\((.*)\)\*$/.exec(line);
  if (noteMatch) {
    note = noteMatch[1];
    line = line.slice(0, noteMatch.index);
  }

  let isPremium = false;
  const premiumMatch = /\s+\(premium\)$/.exec(line);
  if (premiumMatch) {
    isPremium = true;
    line = line.slice(0, premiumMatch.index);
  }

  let isPriority = false;
  const starMatch = /\s+★$/.exec(line);
  if (starMatch) {
    isPriority = true;
    line = line.slice(0, starMatch.index);
  }

  let tier: Tier | null = null;
  const tierMatch = /\s+—\s+(Core|Supp|Stretch)$/.exec(line);
  if (tierMatch) {
    tier = tierMatch[1] as Tier;
    line = line.slice(0, tierMatch.index);
  }

  const headMatch = /^LC\s+(\d+)\s+—\s+(.+)$/.exec(line);
  if (!headMatch) {
    throw new Error(`Could not parse problem line: "${raw}"`);
  }

  return {
    leetcodeId: parseInt(headMatch[1], 10),
    title: headMatch[2].trim(),
    tier,
    isPriority,
    isPremium,
    note,
  };
}

function parseFile(text: string): ParsedFile {
  const stages: ParsedStage[] = [];
  let currentStage: ParsedStage | null = null;
  let inNotes = false;
  const notesLines: string[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();

    if (inNotes) {
      notesLines.push(rawLine);
      continue;
    }

    if (!line || line === '---') continue;

    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      if (heading === NOTES_HEADING) {
        inNotes = true;
        continue;
      }
      const stageMatch = /^(.+?)\s+—\s+(.+)$/.exec(heading);
      if (!stageMatch) {
        throw new Error(`Could not parse stage heading: "${line}"`);
      }
      const [, label, title] = stageMatch;
      currentStage = {
        label,
        title,
        insightNote: '',
        isBridge: /^bridge\b/i.test(label),
        problems: [],
      };
      stages.push(currentStage);
      continue;
    }

    if (line.startsWith('*Insight:') && line.endsWith('*')) {
      if (!currentStage) throw new Error(`Insight note found before any stage heading: "${line}"`);
      currentStage.insightNote = line.slice(1, -1).trim();
      continue;
    }

    if (line.startsWith('- LC ')) {
      if (!currentStage) throw new Error(`Problem line found before any stage heading: "${line}"`);
      currentStage.problems.push(parseProblemLine(line.slice(2)));
      continue;
    }

    // Other prose (intro paragraphs, legend line) — ignored.
  }

  const notes = notesLines.length > 0 ? notesLines.join('\n').trim() : null;
  return { stages, notes };
}

// Sibling stages share a number and differ by a letter suffix (Stage 4A, Stage 4B). Two or more
// of them form a group, titled with the first sibling's title before " — "
// ("Two Pointers — Opposite Direction" -> "Two Pointers"). Returns stage label -> group title.
function deriveGroupTitles(stages: ParsedStage[]): Map<string, string> {
  const byNumber = new Map<string, ParsedStage[]>();
  for (const stage of stages) {
    const m = /^Stage\s+(\d+)[A-Z]$/.exec(stage.label);
    if (!m) continue;
    byNumber.set(m[1], [...(byNumber.get(m[1]) ?? []), stage]);
  }

  const groupTitleByLabel = new Map<string, string>();
  for (const siblings of byNumber.values()) {
    if (siblings.length < 2) continue;
    const title = siblings[0].title.split(' — ')[0].trim();
    siblings.forEach((s) => groupTitleByLabel.set(s.label, title));
  }
  return groupTitleByLabel;
}

async function main() {
  const parsedFiles = FILES.map((f) => parseFile(readFileSync(join(DATA_DIR, f), 'utf-8')));
  const allStages = parsedFiles.flatMap((f) => f.stages);
  const notes = parsedFiles.map((f) => f.notes).find((n) => n !== null) ?? null;
  const groupTitleByLabel = deriveGroupTitles(allStages);

  console.log(`Parsed ${allStages.length} stages across ${FILES.length} files.`);

  let stagesCreated = 0;
  let stagesUpdated = 0;
  let roadmapOrder = 0;
  let placementsUpserted = 0;
  let problemsMatched = 0;
  let problemsCreatedUnmatched = 0;
  const unmatched: string[] = [];
  const stagePlacementCounts = new Map<number, number>();

  for (let stageOrder = 0; stageOrder < allStages.length; stageOrder++) {
    const parsed = allStages[stageOrder];

    const groupTitle = groupTitleByLabel.get(parsed.label);
    const group_id = groupTitle
      ? (await prisma.stageGroup.upsert({ where: { title: groupTitle }, create: { title: groupTitle }, update: {} })).id
      : null;

    let stage = await prisma.stage.findFirst({ where: { stage_label: parsed.label } });
    if (stage) {
      stage = await prisma.stage.update({
        where: { id: stage.id },
        data: {
          title: parsed.title,
          insight_note: parsed.insightNote,
          order: stageOrder,
          is_bridge: parsed.isBridge,
          group_id,
        },
      });
      stagesUpdated++;
    } else {
      stage = await prisma.stage.create({
        data: {
          stage_label: parsed.label,
          title: parsed.title,
          insight_note: parsed.insightNote,
          order: stageOrder,
          is_bridge: parsed.isBridge,
          group_id,
        },
      });
      stagesCreated++;
    }

    for (const p of parsed.problems) {
      roadmapOrder++;

      let problem = await prisma.problem.findUnique({ where: { leetcode_id: p.leetcodeId } });
      if (problem) {
        problem = await prisma.problem.update({
          where: { id: problem.id },
          data: { is_premium: p.isPremium, note: p.note },
        });
        problemsMatched++;
      } else {
        problem = await prisma.problem.create({
          data: {
            title: p.title,
            leetcode_id: p.leetcodeId,
            is_premium: p.isPremium,
            note: p.note,
          },
        });
        problemsCreatedUnmatched++;
        unmatched.push(`LC ${p.leetcodeId} — ${p.title}`);
      }

      await prisma.problemStage.upsert({
        where: { problem_id_stage_id: { problem_id: problem.id, stage_id: stage.id } },
        create: {
          problem_id: problem.id,
          stage_id: stage.id,
          roadmap_order: roadmapOrder,
          tier: p.tier,
          is_priority: p.isPriority,
        },
        update: {
          roadmap_order: roadmapOrder,
          tier: p.tier,
          is_priority: p.isPriority,
        },
      });
      placementsUpserted++;

      stagePlacementCounts.set(p.leetcodeId, (stagePlacementCounts.get(p.leetcodeId) ?? 0) + 1);
    }
  }

  const emptyGroups = await prisma.stageGroup.deleteMany({ where: { stages: { none: {} } } });
  console.log(`Stage groups: ${new Set(groupTitleByLabel.values()).size} in use, ${emptyGroups.count} empty removed.`);

  if (notes) {
    const existing = await prisma.resource.findFirst({ where: { title: NOTES_RESOURCE_TITLE } });
    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data: { note: notes } });
    } else {
      await prisma.resource.create({
        data: { title: NOTES_RESOURCE_TITLE, type: 'Other', note: notes, credibility: 'High' },
      });
    }
    console.log(`Upserted Resource "${NOTES_RESOURCE_TITLE}".`);
  }

  const multiStage = [...stagePlacementCounts.entries()].filter(([, count]) => count > 1);

  console.log(`\nStages: ${stagesCreated} created, ${stagesUpdated} updated.`);
  console.log(`ProblemStage placements upserted: ${placementsUpserted}.`);
  console.log(`Problems matched to existing companywise rows: ${problemsMatched}.`);
  console.log(`Problems newly created (no companywise match — difficulty/companies unset): ${problemsCreatedUnmatched}.`);
  if (unmatched.length > 0) {
    console.log(`\nUnmatched roadmap problems needing manual reconciliation:`);
    unmatched.forEach((u) => console.log(`  ${u}`));
  }
  console.log(`\nProblems appearing in more than one stage:`);
  if (multiStage.length === 0) {
    console.log('  (none)');
  } else {
    multiStage.forEach(([leetcodeId, count]) => console.log(`  LC ${leetcodeId} — ${count} placements`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
