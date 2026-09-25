import type { Difficulty } from '@prisma/client';
import { prisma } from './prisma';

// One company's page (spec 009): what of its roadmap footprint is solved, and — new — what it
// asks off the roadmap entirely, as a gap list. Deliberately separate from lib/companyProgress.ts,
// which answers a different question (target companies' progress within the current stage only).

export type CoverageRow = {
  problemId: string;
  stageId: string;
  title: string;
  difficulty: Difficulty | null;
  isPremium: boolean;
  isSolved: boolean;
  stageLabel: string;
  stageTitle: string;
};

export type GapRow = {
  problemId: string;
  title: string;
  difficulty: Difficulty | null;
  isPremium: boolean;
  isSolved: boolean;
  frequency: number | null;
};

export type CompanyDetail = {
  id: string;
  name: string;
  isPreferred: boolean;
  coverage: CoverageRow[];
  gap: GapRow[];
};

export async function getCompanyDetail(companyId: string): Promise<CompanyDetail | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      is_preferred: true,
      problems: {
        select: {
          frequency: true,
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              is_premium: true,
              is_solved: true,
              stages: {
                select: {
                  stage_id: true,
                  is_solved: true,
                  stage: { select: { stage_label: true, title: true, order: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!company) return null;

  const coverage: CoverageRow[] = [];
  const gap: GapRow[] = [];
  for (const link of company.problems) {
    const { problem } = link;
    if (problem.stages.length === 0) {
      gap.push({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        isPremium: problem.is_premium,
        isSolved: problem.is_solved,
        frequency: link.frequency,
      });
      continue;
    }
    for (const placement of problem.stages) {
      coverage.push({
        problemId: problem.id,
        stageId: placement.stage_id,
        title: problem.title,
        difficulty: problem.difficulty,
        isPremium: problem.is_premium,
        isSolved: placement.is_solved,
        stageLabel: placement.stage.stage_label,
        stageTitle: placement.stage.title,
      });
    }
  }

  // Stage order first (matches roadmap browsing order), then title as a stable tiebreak — the
  // stage's own roadmap_order isn't fetched here since rows are already grouped by stage.
  const stageOrder = new Map<string, number>();
  for (const link of company.problems) {
    for (const placement of link.problem.stages) {
      if (!stageOrder.has(placement.stage_id)) stageOrder.set(placement.stage_id, placement.stage.order);
    }
  }
  coverage.sort((a, b) => (stageOrder.get(a.stageId)! - stageOrder.get(b.stageId)!) || a.title.localeCompare(b.title));
  gap.sort((a, b) => (b.frequency ?? -1) - (a.frequency ?? -1) || a.title.localeCompare(b.title));

  return { id: company.id, name: company.name, isPreferred: company.is_preferred, coverage, gap };
}
