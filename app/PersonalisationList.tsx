'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyLogo } from './CompanyLogo';
import { setCompanyPreferred } from './actions';

export type TargetCompany = { id: string; name: string; isPreferred: boolean; logo: string | null };

// The interactive half of the personalisation card: a name filter and an Add / Added button per
// company. The button is `setCompanyPreferred`, the same action CompanyWise's star uses, so both
// surfaces flip one flag and revalidate together.
export function PersonalisationList({ companies }: { companies: TargetCompany[] }) {
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle ? companies.filter((c) => c.name.toLowerCase().includes(needle)) : companies;
    return [...matches].sort(
      (a, b) => Number(b.isPreferred) - Number(a.isPreferred) || a.name.localeCompare(b.name)
    );
  }, [companies, query]);

  return (
    <>
      <div className="relative mt-3">
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

      <ul className="mt-2 max-h-96 overflow-y-auto">
        {visible.length === 0 && (
          <li className="px-2 py-6 text-center text-[13px] text-muted-foreground">No company matches “{query}”.</li>
        )}
        {visible.map((company) => (
          <li key={company.id} className="flex items-center gap-1 py-0.5 text-[13px]">
            {/* The visible chevron, not just a hover state, is what makes this read as a link to
                the company's own page rather than plain text next to the Add button. */}
            <Link
              href={`/companies/${company.id}`}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
            >
              <CompanyLogo name={company.name} logo={company.logo} />
              <span className="min-w-0 flex-1 truncate font-medium">{company.name}</span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            </Link>
            <Button
              type="button"
              size="sm"
              variant={company.isPreferred ? 'secondary' : 'outline'}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setCompanyPreferred(company.id, !company.isPreferred);
                })
              }
              aria-pressed={company.isPreferred}
              aria-label={company.isPreferred ? `Remove ${company.name}` : `Add ${company.name}`}
              className="w-[4.5rem] shrink-0"
            >
              {company.isPreferred ? (
                <>
                  <Check /> Added
                </>
              ) : (
                <>
                  <Plus /> Add
                </>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
