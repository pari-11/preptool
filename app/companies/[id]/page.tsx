import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { getCompanyDetail, type CoverageRow, type GapRow } from '@/lib/companyDetail';
import { companySlug } from '@/lib/companies';
import { logoSrc } from '@/lib/companyLogos';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyLogo } from '@/app/CompanyLogo';
import { SolvedCheckbox } from '@/app/SolvedCheckbox';
import { cn } from '@/lib/utils';
import { AddButton } from './AddButton';

const DIFFICULTY_STYLES = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400',
  Hard: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400',
} as const;

function DifficultyBadge({ difficulty }: { difficulty: CoverageRow['difficulty'] }) {
  return difficulty ? (
    <Badge variant="outline" className={DIFFICULTY_STYLES[difficulty]}>
      {difficulty}
    </Badge>
  ) : (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Unknown
    </Badge>
  );
}

function CoverageItem({ row }: { row: CoverageRow }) {
  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:px-5">
      <SolvedCheckbox problemId={row.problemId} stageId={row.stageId} isSolved={row.isSolved} />
      <Link
        href={`/problems/${row.problemId}`}
        className={cn('min-w-0 flex-1 text-sm font-medium hover:underline', row.isSolved && 'text-muted-foreground')}
      >
        {row.title}
      </Link>
      <Badge variant="secondary" className="shrink-0">
        {row.stageLabel}
      </Badge>
      <DifficultyBadge difficulty={row.difficulty} />
      {row.isPremium && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="LeetCode Premium" />}
    </li>
  );
}

function GapItem({ row }: { row: GapRow }) {
  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:px-5">
      <SolvedCheckbox problemId={row.problemId} stageId={null} isSolved={row.isSolved} />
      <Link
        href={`/problems/${row.problemId}`}
        className={cn('min-w-0 flex-1 text-sm font-medium hover:underline', row.isSolved && 'text-muted-foreground')}
      >
        {row.title}
      </Link>
      {row.frequency !== null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" title="How often this company asks it">
          {row.frequency.toFixed(1)}%
        </span>
      )}
      <DifficultyBadge difficulty={row.difficulty} />
      {row.isPremium && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="LeetCode Premium" />}
    </li>
  );
}

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await getCompanyDetail(params.id);
  if (!company) notFound();

  const coverageSolved = company.coverage.filter((r) => r.isSolved).length;
  const gapSolved = company.gap.filter((r) => r.isSolved).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
      <Link href="/companies" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Companies
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <CompanyLogo name={company.name} logo={logoSrc(companySlug(company.name))} className="size-8" />
        <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">{company.name}</h1>
        <AddButton companyId={company.id} name={company.name} isPreferred={company.isPreferred} />
      </header>

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>
          Roadmap: <span className="font-medium tabular-nums text-foreground">{coverageSolved}</span>/
          <span className="tabular-nums">{company.coverage.length}</span> solved
        </span>
        <span>·</span>
        <span>
          Off-roadmap: <span className="font-medium tabular-nums text-foreground">{gapSolved}</span>/
          <span className="tabular-nums">{company.gap.length}</span> solved
        </span>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">On your roadmap</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {company.coverage.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              {company.name} doesn't ask any problem that's on your roadmap.
            </p>
          ) : (
            <ul className="divide-y">
              {company.coverage.map((row) => (
                <CoverageItem key={`${row.problemId}-${row.stageId}`} row={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Off your roadmap</CardTitle>
          <p className="text-sm text-muted-foreground">
            {company.name} also asks these — they aren't part of the roadmap foundation, but you can track them here.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {company.gap.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Every problem {company.name} asks is already on your roadmap.
            </p>
          ) : (
            <ul className="divide-y">
              {company.gap.map((row) => (
                <GapItem key={row.problemId} row={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
