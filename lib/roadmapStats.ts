import { prisma } from './prisma';

// Shared by the roadmap page (full tiles) and the dashboard (minimized version), so the two
// always agree on the numbers. Counts each problem once even if it sits in two stages (LC 268).
export const DIFFICULTY_META = [
  { key: 'Easy', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'Medium', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'Hard', bar: 'bg-rose-500', dot: 'bg-rose-500' },
] as const;

export type DifficultyStat = (typeof DIFFICULTY_META)[number] & { solved: number; total: number };

export type RoadmapStats = {
  totalCount: number;
  solvedCount: number;
  byDifficulty: DifficultyStat[];
};

export async function getRoadmapStats(): Promise<RoadmapStats> {
  const placements = await prisma.problemStage.findMany({
    select: { problem: { select: { id: true, is_solved: true, difficulty: true } } },
  });

  const problems = new Map<string, { is_solved: boolean; difficulty: string | null }>();
  for (const placement of placements) problems.set(placement.problem.id, placement.problem);
  const all = [...problems.values()];

  return {
    totalCount: all.length,
    solvedCount: all.filter((p) => p.is_solved).length,
    byDifficulty: DIFFICULTY_META.map((d) => {
      const inTier = all.filter((p) => p.difficulty === d.key);
      return { ...d, solved: inTier.filter((p) => p.is_solved).length, total: inTier.length };
    }),
  };
}
