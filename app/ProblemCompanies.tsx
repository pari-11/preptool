import { ChevronRight } from 'lucide-react';
import { companySlug } from '@/lib/companies';
import { logoSrc } from '@/lib/companyLogos';
import { CompanyLogo } from './CompanyLogo';

export type ProblemCompanyRow = { company: { id: string; name: string; is_preferred: boolean } };

// The row under a problem title listing which of the user's starred companies ask it. Only
// preferred companies appear: every problem here is asked by a dozen-odd companies and listing them
// all would drown the row. A native <details> keeps this a server component with no JS — the marker
// is hidden and replaced by the chevron so it can rotate on open (see globals.css).
export function ProblemCompanies({ companies }: { companies: ProblemCompanyRow[] }) {
  const preferred = companies
    .filter((c) => c.company.is_preferred)
    .map((c) => c.company)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (preferred.length === 0) return null;

  return (
    <details className="group/companies mt-1">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3 transition-transform group-open/companies:rotate-90" aria-hidden />
        <span className="flex gap-0.5">
          {preferred.slice(0, 4).map((c) => (
            <CompanyLogo key={c.id} name={c.name} logo={logoSrc(companySlug(c.name))} className="size-3.5" />
          ))}
        </span>
        <span className="tabular-nums">
          {preferred.length} {preferred.length === 1 ? 'company' : 'companies'}
        </span>
      </summary>

      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {preferred.map((c) => (
          <li
            key={c.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <CompanyLogo name={c.name} logo={logoSrc(companySlug(c.name))} className="size-3.5" />
            {c.name}
          </li>
        ))}
      </ul>
    </details>
  );
}
