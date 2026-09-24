import type { Difficulty } from '@prisma/client';
import { prisma } from './prisma';

// Per-target-company progress for the dashboard's "Your companies" card (spec 007). Progress counts
// distinct roadmap problems the company asks; the next pick is drawn only from the current stage
// (Next up's definition), so focusing on a company never points past roadmap order.

export type CompanyNext = { id: string; title: string; difficulty: Difficulty | null };

export type CompanyProgress = {
  id: string;
  name: string;
  solved: number;
  total: number;
  // null when there is nothing unsolved in the current stage that this company asks.
  next: CompanyNext | null;
};

type StageInput = {
  problems: {
    roadmap_order: number;
    is_solved: boolean;
    problem: {
      id: string;
      title: string;
      difficulty: Difficulty | null;
      companies: { company_id: string }[];
    };
  }[];
};

// Exported separately from getTargetCompanyProgress so the counting and next-pick rules can be
// checked against synthetic fixtures without touching the database. `stages` must be in roadmap
// order with each stage's placements in roadmap_order.
export function summariseCompanyProgress(
  targets: { id: string; name: string }[],
  stages: StageInput[]
): CompanyProgress[] {
  // One entry per distinct problem: a problem in two stages (LC 268) counts once, solved if any of
  // its placements is.
  const problems = new Map<string, { asked: Set<string>; solved: boolean }>();
  for (const stage of stages) {
    for (const placement of stage.problems) {
      const existing = problems.get(placement.problem.id);
      if (existing) {
        existing.solved = existing.solved || placement.is_solved;
      } else {
        problems.set(placement.problem.id, {
          asked: new Set(placement.problem.companies.map((c) => c.company_id)),
          solved: placement.is_solved,
        });
      }
    }
  }

  const current = stages.find((stage) => stage.problems.some((p) => !p.is_solved));
  const currentUnsolved = current ? current.problems.filter((p) => !p.is_solved) : [];

  return targets.map((company) => {
    let solved = 0;
    let total = 0;
    for (const p of problems.values()) {
      if (!p.asked.has(company.id)) continue;
      total++;
      if (p.solved) solved++;
    }
    const pick = currentUnsolved.find((p) => p.problem.companies.some((c) => c.company_id === company.id));
    return {
      id: company.id,
      name: company.name,
      solved,
      total,
      next: pick ? { id: pick.problem.id, title: pick.problem.title, difficulty: pick.problem.difficulty } : null,
    };
  });
}

export async function getTargetCompanyProgress(): Promise<CompanyProgress[]> {
  const [targets, stages] = await Promise.all([
    prisma.company.findMany({
      where: { is_preferred: true, is_excluded: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.stage.findMany({
      orderBy: { order: 'asc' },
      select: {
        problems: {
          orderBy: { roadmap_order: 'asc' },
          select: {
            roadmap_order: true,
            is_solved: true,
            problem: {
              select: { id: true, title: true, difficulty: true, companies: { select: { company_id: true } } },
            },
          },
        },
      },
    }),
  ]);
  return summariseCompanyProgress(targets, stages);
}
