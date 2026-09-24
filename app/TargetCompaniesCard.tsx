import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTargetCompanyProgress } from '@/lib/companyProgress';
import { companySlug } from '@/lib/companies';
import { logoSrc } from '@/lib/companyLogos';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { CompanyLogo } from './CompanyLogo';

const DIFFICULTY_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' } as const;

// The companies picked on /profile, each with how much of the roadmap it asks has been solved and
// the next thing to do for it (spec 007). The next pick never leaves the current stage.
export async function TargetCompaniesCard() {
  const companies = await getTargetCompanyProgress();

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Your companies</span>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Edit <ArrowRight className="size-3" />
        </Link>
      </div>

      {companies.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Pick the companies you're targeting on your{' '}
          <Link href="/profile" className="font-medium text-primary underline-offset-2 hover:underline">
            profile
          </Link>{' '}
          and their progress shows up here.
        </p>
      ) : (
        <ul className="mt-3 flex max-h-96 flex-col gap-3 overflow-y-auto overflow-x-hidden">
          {companies.map((company) => {
            const pct = company.total > 0 ? (company.solved / company.total) * 100 : 0;
            const allSolved = company.total > 0 && company.solved === company.total;
            return (
              <li key={company.id}>
                <div className="flex items-center gap-2 text-sm">
                  <CompanyLogo name={company.name} logo={logoSrc(companySlug(company.name))} />
                  <span className="min-w-0 flex-1 truncate font-medium">{company.name}</span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {company.solved}/{company.total}
                  </span>
                </div>
                <ProgressBar
                  value={pct}
                  label={`${company.solved} of ${company.total} ${company.name} roadmap problems solved`}
                  className="mt-1.5"
                />
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {company.total === 0 ? (
                    'No roadmap problems'
                  ) : allSolved ? (
                    'All solved'
                  ) : company.next ? (
                    <Link
                      href={`/problems/${company.next.id}`}
                      className="flex items-center gap-2 py-0.5 transition-colors hover:text-foreground"
                    >
                      <span>Next</span>
                      {company.next.difficulty && (
                        <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[company.next.difficulty])} />
                      )}
                      <span className="min-w-0 truncate font-medium text-foreground">{company.next.title}</span>
                    </Link>
                  ) : (
                    'Nothing for this company in your current stage'
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
