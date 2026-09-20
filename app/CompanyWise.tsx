'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Building2, ChevronDown, Search, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { companyInitials, companyTint, type CompanyInfo } from '@/lib/companies';
import { filtersHref, toggleIn, type RoadmapFilters } from '@/lib/roadmapFilters';
import { cn } from '@/lib/utils';
import { setCompanyPreferred } from './actions';

// Client-side twin of app/CompanyLogo.tsx. The server already resolved whether a logo file exists,
// so this only has to render what it was given.
function Logo({ company, className }: { company: CompanyInfo; className?: string }) {
  if (company.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- small static asset, no optimisation needed
    return <img src={company.logo} alt="" aria-hidden className={cn('size-4 shrink-0 rounded-[3px] object-contain', className)} />;
  }
  return (
    <span
      aria-hidden
      style={{ backgroundColor: companyTint(company.name) }}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold leading-none text-white',
        className
      )}
    >
      {companyInitials(company.name)}
    </span>
  );
}

// "CompanyWise": pick a company and the roadmap narrows to the problems that company asks. The
// star is a separate job in the same place — starred companies are the ones whose chips show under
// each problem — because both answer "which companies do I care about" and splitting them into two
// screens would mean setting the same list twice.
export function CompanyWise({
  filters,
  companies,
}: {
  filters: RoadmapFilters;
  companies: CompanyInfo[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();

  const selected = filters.company;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle ? companies.filter((c) => c.name.toLowerCase().includes(needle)) : companies;
    // Starred first, then by how much of the roadmap they cover.
    return [...matches].sort(
      (a, b) => Number(b.isPreferred) - Number(a.isPreferred) || b.count - a.count || a.name.localeCompare(b.name)
    );
  }, [companies, query]);

  const starredCount = companies.filter((c) => c.isPreferred).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:border-primary/50 data-popup-open:border-primary',
          selected.length > 0 && 'border-primary/60'
        )}
      >
        <Building2 className="size-4 text-muted-foreground" />
        CompanyWise
        {selected.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
            {selected.length}
          </span>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[20rem] max-w-[calc(100vw-2rem)] p-0" initialFocus={(t) => t === 'keyboard'}>
        <div className="border-b p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies"
              aria-label="Search companies"
              className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-primary"
            />
          </div>
          <p className="mt-2 px-0.5 text-[11px] leading-snug text-muted-foreground">
            Click a company to filter the roadmap. Star the ones you are targeting — only starred
            companies show under each problem.
          </p>
        </div>

        <ul className="max-h-[19rem] overflow-y-auto p-1.5">
          {visible.length === 0 && (
            <li className="px-2 py-6 text-center text-[13px] text-muted-foreground">No company matches “{query}”.</li>
          )}
          {visible.map((company) => {
            const active = selected.includes(company.slug);
            return (
              <li key={company.id} className="flex items-center gap-1">
                <Link
                  href={filtersHref({ ...filters, company: toggleIn(selected, company.slug) })}
                  scroll={false}
                  aria-pressed={active}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Logo company={company} />
                  <span className="min-w-0 flex-1 truncate font-medium">{company.name}</span>
                  <span className={cn('shrink-0 text-xs tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')}>
                    {company.count}
                  </span>
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setCompanyPreferred(company.id, !company.isPreferred);
                    })
                  }
                  aria-pressed={company.isPreferred}
                  aria-label={company.isPreferred ? `Unstar ${company.name}` : `Star ${company.name}`}
                  title={company.isPreferred ? 'Starred — shown under each problem' : 'Star this company'}
                  className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Star
                    className={cn(
                      'size-3.5 transition-colors',
                      company.isPreferred ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/50'
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span>
            {starredCount} starred · {companies.length} companies
          </span>
          {selected.length > 0 && (
            <Link
              href={filtersHref({ ...filters, company: [] })}
              scroll={false}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Clear selection
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
