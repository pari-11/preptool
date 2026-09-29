import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NeetCode has no public API for this; their sitemap.xml is the only stable source of which
// problems actually have a solutions page. Re-runnable/idempotent like the other import scripts —
// safe to run again whenever NeetCode adds coverage. Slugs mostly follow LeetCode's own slug, so
// matching is done by extracting the slug already embedded in Problem.source_link.
const SITEMAP_URL = 'https://neetcode.io/sitemap.xml';

function slugFromSourceLink(sourceLink: string): string | null {
  const match = sourceLink.match(/leetcode\.com\/problems\/([^/]+)\/?/);
  return match ? match[1] : null;
}

async function fetchNeetcodeSolutionSlugs(): Promise<Set<string>> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${SITEMAP_URL}: ${res.status}`);
  const xml = await res.text();
  const slugs = new Set<string>();
  for (const match of xml.matchAll(/<loc>https:\/\/neetcode\.io\/solutions\/([^<]+)<\/loc>/g)) {
    slugs.add(match[1]);
  }
  return slugs;
}

async function main() {
  const solutionSlugs = await fetchNeetcodeSolutionSlugs();
  console.log(`Found ${solutionSlugs.size} NeetCode solution pages.`);

  const problems = await prisma.problem.findMany({
    where: { source_link: { not: null } },
    select: { id: true, source_link: true, neetcode_link: true },
  });

  let updated = 0;
  let unchanged = 0;
  let noMatch = 0;

  for (const problem of problems) {
    const slug = slugFromSourceLink(problem.source_link!);
    if (!slug || !solutionSlugs.has(slug)) {
      noMatch++;
      continue;
    }
    const neetcodeLink = `https://neetcode.io/solutions/${slug}`;
    if (problem.neetcode_link === neetcodeLink) {
      unchanged++;
      continue;
    }
    await prisma.problem.update({ where: { id: problem.id }, data: { neetcode_link: neetcodeLink } });
    updated++;
  }

  console.log(`\nUpdated ${updated}, already correct ${unchanged}, no NeetCode match ${noMatch}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
