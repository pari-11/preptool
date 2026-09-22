import type { Difficulty } from '@prisma/client';
import { prisma } from './prisma';

// "Current stage" = the first Stage in roadmap order with any unsolved placement (spec 006's
// settled definition). Stage-level, not group-level: StageGroup is a display wrapper only, and
// progression is tracked per stage exactly like the roadmap checkboxes are.

export type NextUpProblem = {
  id: string;
  title: string;
  difficulty: Difficulty | null;
};

export type NextUpResult =
  | { done: true }
  | {
      done: false;
      stageLabel: string;
      stageTitle: string;
      groupTitle: string | null;
      solved: number;
      total: number;
      problems: NextUpProblem[];
    };

// Inside a group the shared prefix is dropped, matching app/StageSection.tsx's subTitle() — kept
// as a small standalone copy rather than an import, so lib/ stays independent of app/.
function stageSubTitle(title: string): string {
  const rest = title.split(' — ').slice(1).join(' — ');
  return rest || title;
}

type RankablePlacement = {
  roadmap_order: number;
  problem: { companies: { company_id: string }[] };
};

// Exported separately from getNextUp so the ordering rule (preferred-company match first, then
// roadmap_order) can be checked against synthetic fixtures without touching the database.
export function rankUnsolved<T extends RankablePlacement>(placements: T[], preferredCompanyIds: Set<string>): T[] {
  return [...placements].sort((a, b) => {
    const aPreferred = a.problem.companies.some((c) => preferredCompanyIds.has(c.company_id));
    const bPreferred = b.problem.companies.some((c) => preferredCompanyIds.has(c.company_id));
    if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
    return a.roadmap_order - b.roadmap_order;
  });
}

export async function getNextUp(): Promise<NextUpResult> {
  const [preferredCompanies, stages] = await Promise.all([
    prisma.company.findMany({ where: { is_preferred: true }, select: { id: true } }),
    prisma.stage.findMany({
      orderBy: { order: 'asc' },
      include: {
        group: true,
        problems: {
          orderBy: { roadmap_order: 'asc' },
          include: { problem: { include: { companies: true } } },
        },
      },
    }),
  ]);
  const preferredCompanyIds = new Set(preferredCompanies.map((c) => c.id));

  const current = stages.find((stage) => stage.problems.some((p) => !p.is_solved));
  if (!current) return { done: true };

  const solved = current.problems.filter((p) => p.is_solved).length;
  const total = current.problems.length;

  // Preferred-company matches sort first within the stage (personalisation reorders, never
  // unlocks — the candidate pool never leaves this stage); ties keep roadmap_order.
  const ranked = rankUnsolved(
    current.problems.filter((p) => !p.is_solved),
    preferredCompanyIds
  );

  return {
    done: false,
    stageLabel: current.stage_label,
    stageTitle: current.group ? stageSubTitle(current.title) : current.title,
    groupTitle: current.group?.title ?? null,
    solved,
    total,
    problems: ranked.slice(0, 2).map((p) => ({
      id: p.problem.id,
      title: p.problem.title,
      difficulty: p.problem.difficulty,
    })),
  };
}
