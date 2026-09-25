'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, FileText, Search as SearchIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { runSearch } from './actions';
import type { SearchResult, SearchResults } from '@/lib/search';

const EMPTY: SearchResults = {
  problems: [],
  resources: [],
  companies: [],
  problemsMore: false,
  resourcesMore: false,
  companiesMore: false,
  total: 0,
};

// One look per source, so a result reads as "which kind of thing is this" at a glance — not just
// text. Problems get LeetCode's own mark (public/leetcode-logo.png, their real favicon — there's
// no brand-neutral stand-in that reads as clearly). Resources and companies have no single logo to
// show here (a company's own logo is shown on its own pages; search stays generic), so they get a
// coloured icon instead, picked to stay obviously distinct from LeetCode's orange/black mark.
const SOURCE_STYLE = {
  resource: { icon: FileText, iconBg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
  company: { icon: Building2, iconBg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
} as const;
const PROBLEM_TEXT = 'text-amber-600 dark:text-amber-400'; // echoes LeetCode's own orange

function sourceTextClass(sourceType: SearchResult['sourceType']): string {
  return sourceType === 'problem' ? PROBLEM_TEXT : SOURCE_STYLE[sourceType].text;
}

function SourceIcon({ sourceType }: { sourceType: SearchResult['sourceType'] }) {
  if (sourceType === 'problem') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small static asset, no optimisation needed
      <img src="/leetcode-logo.png" alt="" aria-hidden className="size-5 shrink-0 rounded-[4px] object-contain" />
    );
  }
  const { icon: Icon, iconBg } = SOURCE_STYLE[sourceType];
  return (
    <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-white', iconBg)}>
      <Icon className="size-3" />
    </span>
  );
}

function Group({
  sourceType,
  label,
  more,
  children,
}: {
  sourceType: SearchResult['sourceType'];
  label: string;
  more?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={cn('px-2.5 pt-2 text-[11px] font-semibold uppercase tracking-wide', sourceTextClass(sourceType))}>{label}</p>
      {children}
      {more && <p className="px-2.5 pb-1 text-[11px] text-muted-foreground">More match — keep typing to narrow it down.</p>}
    </div>
  );
}

// A row's title always gets to show in full — it wraps onto a second line rather than being cut
// off, with the icon and source label riding along the top of the wrapped text.
function Row({ result, external }: { result: SearchResult; external?: boolean }) {
  const content = (
    <>
      <SourceIcon sourceType={result.sourceType} />
      <span className="min-w-0 flex-1 text-[13px] leading-snug">{result.title}</span>
      <span className={cn('shrink-0 text-[11px] font-medium', sourceTextClass(result.sourceType))}>{result.sourceLabel}</span>
      {external && result.href && <ExternalLink className="size-3 shrink-0 self-center text-muted-foreground" />}
    </>
  );
  const className = 'flex flex-wrap items-start gap-x-2 gap-y-0.5 rounded-md px-2.5 py-1.5 transition-colors hover:bg-muted';

  if (!result.href) {
    // No resource detail page exists yet (spec 010 S5) — shown, not clickable.
    return <div className={cn(className, 'text-muted-foreground')}>{content}</div>;
  }
  return external ? (
    <a href={result.href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={result.href} className={className}>
      {content}
    </Link>
  );
}

// One header search over everything that exists today (spec 010): Problem, Resource, Company,
// grouped and each labelled and coloured by source. The same popover pattern app/CompanyWise.tsx
// uses.
export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const r = await runSearch(q);
        if (id === requestId.current) setResults(r);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function reset() {
    setQuery('');
    setResults(EMPTY);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger
        aria-label="Search"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
      >
        <SearchIcon className="size-4" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[28rem] max-w-[calc(100vw-2rem)] p-0" initialFocus={(t) => t === 'keyboard'}>
        <div className="border-b p-2.5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems, notes, companies…"
              aria-label="Search"
              className="h-9 w-full rounded-md border bg-background pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-1.5">
          {query.trim().length < 2 ? (
            <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">Type at least 2 characters.</p>
          ) : results.total === 0 ? (
            <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">
              {pending ? 'Searching…' : `No results for "${query.trim()}".`}
            </p>
          ) : (
            <>
              {results.problems.length > 0 && (
                <Group sourceType="problem" label="Problems" more={results.problemsMore}>
                  <ul onClick={() => setOpen(false)}>
                    {results.problems.map((r) => (
                      <li key={r.id}>
                        <Row result={r} />
                      </li>
                    ))}
                  </ul>
                </Group>
              )}

              {results.resources.length > 0 && (
                <Group sourceType="resource" label="Resources" more={results.resourcesMore}>
                  <ul>
                    {results.resources.map((r) => (
                      <li key={r.id}>
                        <Row result={r} external />
                      </li>
                    ))}
                  </ul>
                </Group>
              )}

              {results.companies.length > 0 && (
                <Group sourceType="company" label="Companies" more={results.companiesMore}>
                  <ul onClick={() => setOpen(false)}>
                    {results.companies.map((r) => (
                      <li key={r.id}>
                        <Row result={r} />
                      </li>
                    ))}
                  </ul>
                </Group>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
