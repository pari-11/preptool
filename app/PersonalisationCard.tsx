import { prisma } from '@/lib/prisma';
import { companySlug } from '@/lib/companies';
import { logoSrc } from '@/lib/companyLogos';
import { PersonalisationList, type TargetCompany } from './PersonalisationList';

// "Which companies are you targeting?" (spec 006 part F). Lives on the profile page today and is
// meant to be reusable as a first-run question when sign-up exists. "Target" is exactly
// Company.is_preferred, the flag CompanyWise stars on /roadmap; Next up and the review queue read it
// to reorder within what's unlocked. Excluded companies are left out entirely.
export async function PersonalisationCard() {
  const rows = await prisma.company.findMany({
    where: { is_excluded: false },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, is_preferred: true },
  });
  const companies: TargetCompany[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    isPreferred: c.is_preferred,
    logo: logoSrc(companySlug(c.name)),
  }));
  const added = companies.filter((c) => c.isPreferred).length;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Which companies are you targeting?</h2>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{added} added</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Their problems move up within your current stage and your review queue. Nothing jumps ahead of
        roadmap order.
      </p>
      <PersonalisationList companies={companies} />
    </div>
  );
}
