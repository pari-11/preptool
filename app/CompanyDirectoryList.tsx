'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { companySlug } from '@/lib/companies';
import { type CompanyDirectoryEntry } from '@/lib/companyDirectory';
import { CompanyLogo } from './CompanyLogo';

// A plain browse-and-link surface (spec 009 part B) — no Add/target control here, that stays
// exclusively /profile's job. logos map is precomputed server-side (logoSrc reads the filesystem).
export function CompanyDirectoryList({
  companies,
  logos,
}: {
  companies: CompanyDirectoryEntry[];
  logos: Record<string, string | null>;
}) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? companies.filter((c) => c.name.toLowerCase().includes(needle)) : companies;
  }, [companies, query]);

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies"
          aria-label="Search companies"
          className="h-9 w-full rounded-md border bg-background pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />
      </div>

      <ul className="mt-2 divide-y rounded-xl border bg-card shadow-xs">
        {visible.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No company matches "{query}".</li>
        )}
        {visible.map((company) => (
          <li key={company.id}>
            <Link
              href={`/companies/${company.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
            >
              <CompanyLogo name={company.name} logo={logos[companySlug(company.name)] ?? null} />
              <span className="min-w-0 flex-1 truncate font-medium">{company.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {company.roadmapTotal === 0 ? 'No roadmap problems' : `${company.roadmapSolved}/${company.roadmapTotal} solved`}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
