import type { ResourceType } from '@prisma/client';
import { prisma } from './prisma';

// One header search over everything that exists today: Problem, Resource, Company (spec 010).
// Each result carries its own sourceType and label so a future source (a ProblemSet import, a
// Track) is one more query added to Promise.all below, not a rewrite of this shape.

export type SearchResult = {
  sourceType: 'problem' | 'resource' | 'company';
  id: string;
  title: string;
  sourceLabel: string;
  href: string | null; // null = matched but nothing to click through to yet (see resources below)
};

export type SearchResults = {
  problems: SearchResult[];
  resources: SearchResult[];
  companies: SearchResult[];
  problemsMore: boolean;
  resourcesMore: boolean;
  companiesMore: boolean;
  total: number;
};

const GROUP_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;

// Friendlier than the raw enum value in a result row.
const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  OAReport: 'OA report',
  InterviewExperience: 'Interview experience',
  Article: 'Article',
  CoreSubject: 'Core subject',
  Aptitude: 'Aptitude',
  Other: 'Notes',
};

const EMPTY: SearchResults = {
  problems: [],
  resources: [],
  companies: [],
  problemsMore: false,
  resourcesMore: false,
  companiesMore: false,
  total: 0,
};

export async function search(rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LENGTH) return EMPTY;

  const [problemRows, resourceRows, companyRows] = await Promise.all([
    prisma.problem.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { user_note: { contains: q, mode: 'insensitive' } },
          { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      },
      select: { id: true, title: true, leetcode_id: true },
      orderBy: { title: 'asc' },
      take: GROUP_LIMIT + 1,
    }),
    prisma.resource.findMany({
      where: {
        OR: [{ title: { contains: q, mode: 'insensitive' } }, { topic: { contains: q, mode: 'insensitive' } }],
      },
      select: { id: true, title: true, type: true, link: true },
      orderBy: { title: 'asc' },
      take: GROUP_LIMIT + 1,
    }),
    prisma.company.findMany({
      where: { is_excluded: false, name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: GROUP_LIMIT + 1,
    }),
  ]);

  const problems: SearchResult[] = problemRows.slice(0, GROUP_LIMIT).map((p) => ({
    sourceType: 'problem',
    id: p.id,
    title: p.title,
    // Every problem today has a leetcode_id (all 798 imported rows do), but the column is
    // nullable specifically for a future non-LeetCode item (CLAUDE.local.md Part 2) — the label
    // is computed per row, not hardcoded, so that path doesn't silently mislabel itself later.
    sourceLabel: p.leetcode_id !== null ? 'LeetCode' : 'Problem',
    href: `/problems/${p.id}`,
  }));
  const resources: SearchResult[] = resourceRows.slice(0, GROUP_LIMIT).map((r) => ({
    sourceType: 'resource',
    id: r.id,
    title: r.title,
    sourceLabel: RESOURCE_TYPE_LABELS[r.type],
    // No resource detail page exists yet; an external link is the only thing to open (spec 010 S5).
    href: r.link || null,
  }));
  const companies: SearchResult[] = companyRows.slice(0, GROUP_LIMIT).map((c) => ({
    sourceType: 'company',
    id: c.id,
    title: c.name,
    sourceLabel: 'Company',
    href: `/companies/${c.id}`,
  }));

  return {
    problems,
    resources,
    companies,
    problemsMore: problemRows.length > GROUP_LIMIT,
    resourcesMore: resourceRows.length > GROUP_LIMIT,
    companiesMore: companyRows.length > GROUP_LIMIT,
    total: problems.length + resources.length + companies.length,
  };
}

// The narrower problem-only search the "add link" flow reuses (spec 010 L4) — same matching rule
// as the problem half of search() above, kept in sync by sharing this helper.
export async function searchProblems(rawQuery: string, excludeId?: string) {
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LENGTH) return [];
  const rows = await prisma.problem.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { user_note: { contains: q, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
      ],
    },
    select: { id: true, title: true, difficulty: true },
    orderBy: { title: 'asc' },
    take: GROUP_LIMIT,
  });
  return rows;
}
