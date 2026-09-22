import type { Difficulty } from '@prisma/client';
import { prisma } from './prisma';

// Review-queue interval mapping, settled in spec 006: lower confidence resurfaces sooner, unrated
// and "date unknown" solves are always due so they can't quietly disappear from view.
export const REVIEW_INTERVAL_DAYS: Record<number, number> = {
  1: 0,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const UNRATED_INTERVAL_DAYS = 0;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ReviewableProblem = {
  confidence: number | null;
  // Last Solved or Revised event — not a bare Revisited glance (see lib/solve.ts). This is what
  // the staleness clock reads, deliberately not last_solved_date.
  last_reviewed_date: Date | null;
};

function intervalDays(confidence: number | null): number {
  if (confidence === null) return UNRATED_INTERVAL_DAYS;
  return REVIEW_INTERVAL_DAYS[confidence] ?? UNRATED_INTERVAL_DAYS;
}

// null = never reviewed with a date (only the removed bulk importer ever produced an undated
// solve). Staleness can't be computed then, so there's no due date to give — always due.
export function dueDate(problem: ReviewableProblem): Date | null {
  if (!problem.last_reviewed_date) return null;
  const due = new Date(problem.last_reviewed_date);
  due.setDate(due.getDate() + intervalDays(problem.confidence));
  return due;
}

export function isDue(problem: ReviewableProblem, today: Date = new Date()): boolean {
  const due = dueDate(problem);
  if (!due) return true;
  return due.getTime() <= today.getTime();
}

// Infinity for a date-unknown solve: it sorts as maximally overdue rather than crashing or being
// silently skipped (none exist today, but the code must not choke if one ever does).
export function daysOverdue(problem: ReviewableProblem, today: Date = new Date()): number {
  const due = dueDate(problem);
  if (!due) return Infinity;
  return Math.floor((today.getTime() - due.getTime()) / MS_PER_DAY);
}

type RankableProblem = ReviewableProblem & {
  companies: { company_id: string }[];
};

// Exported separately from getReviewQueue so the ordering rule can be checked against synthetic
// fixtures without touching the database. Assumes `problems` is already filtered to is_solved and
// isDue — this function only ranks, it doesn't decide eligibility.
export function rankQueue<T extends RankableProblem>(
  problems: T[],
  preferredCompanyIds: Set<string>,
  today: Date = new Date()
): (T & { daysOverdue: number })[] {
  return problems
    .map((p) => ({ ...p, daysOverdue: daysOverdue(p, today) }))
    .sort((a, b) => {
      if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
      const aPreferred = a.companies.some((c) => preferredCompanyIds.has(c.company_id));
      const bPreferred = b.companies.some((c) => preferredCompanyIds.has(c.company_id));
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      const aConfidence = a.confidence ?? 0;
      const bConfidence = b.confidence ?? 0;
      if (aConfidence !== bConfidence) return aConfidence - bConfidence;
      return (a.last_reviewed_date?.getTime() ?? 0) - (b.last_reviewed_date?.getTime() ?? 0);
    });
}

export type QueueItem = {
  id: string;
  title: string;
  difficulty: Difficulty | null;
  daysOverdue: number;
};

export type ReviewQueue = {
  total: number;
  items: QueueItem[];
};

export async function getReviewQueue(limit: number): Promise<ReviewQueue> {
  const [preferredCompanies, problems] = await Promise.all([
    prisma.company.findMany({ where: { is_preferred: true }, select: { id: true } }),
    // is_solved is the roll-up, so an untouched-but-stale confidence/last_solved_date left over
    // from a previous solve-then-untick can never surface here (spec 006 part D's last criterion).
    prisma.problem.findMany({
      where: { is_solved: true },
      select: {
        id: true,
        title: true,
        difficulty: true,
        confidence: true,
        last_reviewed_date: true,
        companies: { select: { company_id: true } },
      },
    }),
  ]);
  const preferredCompanyIds = new Set(preferredCompanies.map((c) => c.id));

  const due = problems.filter((p) => isDue(p));
  const ranked = rankQueue(due, preferredCompanyIds);

  return {
    total: ranked.length,
    items: ranked.slice(0, limit).map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      daysOverdue: p.daysOverdue,
    })),
  };
}
