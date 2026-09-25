import { prisma } from './prisma';

// Every company as a browsable directory (spec 009 part B) — deliberately separate from
// lib/companyProgress.ts (target companies only) and lib/companyDetail.ts (one company's full
// breakdown). This is just enough per company to list and link onward.

export type CompanyDirectoryEntry = {
  id: string;
  name: string;
  roadmapSolved: number;
  roadmapTotal: number;
};

export async function getCompanyDirectory(): Promise<CompanyDirectoryEntry[]> {
  const companies = await prisma.company.findMany({
    where: { is_excluded: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      problems: {
        select: { problem: { select: { id: true, is_solved: true, _count: { select: { stages: true } } } } },
      },
    },
  });

  // Prisma's orderBy sorts by the database's raw collation, which can put "AMD" before "Adobe" —
  // a localeCompare pass matches the case-insensitive alphabetical order the rest of the app uses
  // (app/PersonalisationList.tsx, app/CompanyWise.tsx).
  companies.sort((a, b) => a.name.localeCompare(b.name));

  return companies.map((c) => {
    // Dedup by problem (a problem in two stages counts once), same rule as spec 007's card.
    const roadmapProblems = new Map<string, boolean>();
    for (const link of c.problems) {
      if (link.problem._count.stages > 0) roadmapProblems.set(link.problem.id, link.problem.is_solved);
    }
    const solvedFlags = [...roadmapProblems.values()];
    return {
      id: c.id,
      name: c.name,
      roadmapTotal: solvedFlags.length,
      roadmapSolved: solvedFlags.filter(Boolean).length,
    };
  });
}
