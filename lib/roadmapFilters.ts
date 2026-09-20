// Roadmap filters live in the URL (?status=unsolved&difficulty=Easy&rating=4&rating=5&tag=<id>
// &company=adobe) so the server does the filtering and any filtered view can be bookmarked or
// shared. Different filters combine with AND; several values of one filter combine with OR.
// `company` holds company slugs rather than ids so the URL stays readable (?company=goldman-sachs).

import { companySlug } from './companies';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type DifficultyName = (typeof DIFFICULTIES)[number];
export type StatusFilter = 'all' | 'solved' | 'unsolved';

export type RoadmapFilters = {
  status: StatusFilter;
  difficulty: DifficultyName[];
  rating: number[];
  tag: string[];
  company: string[];
};

type RawParams = Record<string, string | string[] | undefined>;

function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function parseFilters(params: RawParams): RoadmapFilters {
  const status: StatusFilter = params.status === 'solved' || params.status === 'unsolved' ? params.status : 'all';
  const difficulty = unique(
    many(params.difficulty).filter((d): d is DifficultyName => (DIFFICULTIES as readonly string[]).includes(d))
  );
  const rating = unique(many(params.rating).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)).sort();
  return {
    status,
    difficulty,
    rating,
    tag: unique(many(params.tag)),
    company: unique(many(params.company)),
  };
}

export function isFiltering(f: RoadmapFilters): boolean {
  return (
    f.status !== 'all' ||
    f.difficulty.length > 0 ||
    f.rating.length > 0 ||
    f.tag.length > 0 ||
    f.company.length > 0
  );
}

export function filtersHref(f: RoadmapFilters): string {
  const query = new URLSearchParams();
  if (f.status !== 'all') query.set('status', f.status);
  f.difficulty.forEach((d) => query.append('difficulty', d));
  f.rating.forEach((r) => query.append('rating', String(r)));
  f.tag.forEach((t) => query.append('tag', t));
  f.company.forEach((c) => query.append('company', c));
  const text = query.toString();
  return text ? `/?${text}` : '/';
}

export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

type FilterablePlacement = {
  is_solved: boolean;
  problem: {
    difficulty: string | null;
    confidence: number | null;
    tags: { tag_id: string }[];
    companies: { company: { name: string } }[];
  };
};

// Solved state is per placement (the row's checkbox), so status and rating look at the placement:
// a problem solved in Stage 2 but not Stage 22 counts as solved only in the Stage 2 row.
// A rating only exists on a solved row, so filtering by rating implies solved.
export function placementMatches(p: FilterablePlacement, f: RoadmapFilters): boolean {
  if (f.status === 'solved' && !p.is_solved) return false;
  if (f.status === 'unsolved' && p.is_solved) return false;
  if (f.difficulty.length > 0 && !(p.problem.difficulty && (f.difficulty as string[]).includes(p.problem.difficulty))) {
    return false;
  }
  if (f.rating.length > 0 && !(p.is_solved && p.problem.confidence !== null && f.rating.includes(p.problem.confidence))) {
    return false;
  }
  if (f.tag.length > 0 && !p.problem.tags.some((t) => f.tag.includes(t.tag_id))) return false;
  if (
    f.company.length > 0 &&
    !p.problem.companies.some((c) => f.company.includes(companySlug(c.company.name)))
  ) {
    return false;
  }
  return true;
}
