import { prisma } from './prisma';
import { isDue } from './reviewQueue';

// Strengths & weaknesses (spec 006 part E). Three states, not two: a stage that hasn't been reached
// is neutral, never a weakness. The unit is a Stage, merged into its StageGroup where one exists.

export const MIN_SAMPLE = 3; // solved placements needed before a unit is judged at all
export const STRONG_AVG_THRESHOLD = 4; // average confidence over the rated problems

export type StrengthState = 'not-reached' | 'weak' | 'strong';

// Why a unit is weak, most specific first. Purely for display: every one of these is "weak" (E3).
export type WeakReason = 'unrated' | 'low-average' | 'partly-unrated' | 'overdue';

export type UnitStrength = {
  key: string;
  title: string; // full: "Stage 1 — Frequency / Memory → Hashing", or the group's title
  name: string; // short, for tight UI: "Frequency / Memory → Hashing", or the group's title
  kicker: string; // "Stage 1", or "Stages 4A · 4B" for a group
  state: StrengthState;
  solved: number; // solved placements (the sample size, E2)
  total: number; // placements in the unit
  rated: number; // distinct solved problems with a confidence
  unrated: number;
  dueCount: number; // distinct solved problems currently due for review
  average: number | null; // over the rated problems; null when none are rated
  reason: WeakReason | null; // set only for weak units
};

type StageInput = {
  id: string;
  stage_label: string;
  title: string;
  group: { id: string; title: string } | null;
  problems: {
    is_solved: boolean;
    problem: { id: string; confidence: number | null; last_reviewed_date: Date | null };
  }[];
};

// Exported separately from getStrengthsWeaknesses so the state rules can be checked against
// synthetic fixtures without touching the database. `stages` must be in roadmap order; units come
// back in the order they first appear.
export function summariseStrengths(stages: StageInput[], today: Date = new Date()): UnitStrength[] {
  const units = new Map<
    string,
    { title: string; name: string; labels: string[]; placements: StageInput['problems'] }
  >();
  for (const stage of stages) {
    const key = stage.group ? `group:${stage.group.id}` : `stage:${stage.id}`;
    const unit = units.get(key) ?? {
      title: stage.group ? stage.group.title : `${stage.stage_label} — ${stage.title}`,
      name: stage.group ? stage.group.title : stage.title,
      labels: [],
      placements: [],
    };
    unit.labels.push(stage.stage_label);
    unit.placements.push(...stage.problems);
    units.set(key, unit);
  }

  return [...units.entries()].map(([key, unit]) => {
    const solvedPlacements = unit.placements.filter((p) => p.is_solved);
    const solved = solvedPlacements.length;

    // Ratings and staleness belong to the problem, not the placement, so a problem sitting in two
    // stages of one group is looked at once.
    const distinct = new Map<string, StageInput['problems'][number]['problem']>();
    for (const p of solvedPlacements) distinct.set(p.problem.id, p.problem);
    const problems = [...distinct.values()];

    const ratings = problems.map((p) => p.confidence).filter((c): c is number => c !== null);
    const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const unrated = problems.length - ratings.length;
    // An unrated solve is always due (lib/reviewQueue.ts), so a unit with any of them can't be strong.
    const dueCount = problems.filter((p) => isDue(p, today)).length;

    let state: StrengthState;
    let reason: WeakReason | null = null;
    if (solved < MIN_SAMPLE) {
      state = 'not-reached';
    } else if (average !== null && average >= STRONG_AVG_THRESHOLD && dueCount === 0) {
      state = 'strong';
    } else {
      state = 'weak';
      reason =
        average === null ? 'unrated' : average < STRONG_AVG_THRESHOLD ? 'low-average' : unrated > 0 ? 'partly-unrated' : 'overdue';
    }

    // "Stage 4A", "Stage 4B" -> "Stages 4A · 4B"; a lone stage keeps its label ("Stage 1", "Bridge B").
    const kicker =
      unit.labels.length > 1
        ? `Stages ${unit.labels.map((l) => l.replace(/^Stage\s+/, '')).join(' · ')}`
        : unit.labels[0];

    return {
      key,
      title: unit.title,
      name: unit.name,
      kicker,
      state,
      solved,
      total: unit.placements.length,
      rated: ratings.length,
      unrated,
      dueCount,
      average,
      reason,
    };
  });
}

export async function getStrengthsWeaknesses(): Promise<UnitStrength[]> {
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      stage_label: true,
      title: true,
      group: { select: { id: true, title: true } },
      problems: {
        select: {
          is_solved: true,
          problem: { select: { id: true, confidence: true, last_reviewed_date: true } },
        },
      },
    },
  });
  return summariseStrengths(stages);
}
