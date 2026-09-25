import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { confidenceLabel } from '@/lib/confidence';
import { getProblemLinks } from '@/lib/itemLinks';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SolvedCheckbox } from '@/app/SolvedCheckbox';
import { ConfidencePicker } from '@/app/ConfidencePicker';
import { RevisitButton } from '@/app/RevisitButton';
import { ProblemTags } from '@/app/ProblemTags';
import { TagsProvider } from '@/app/TagsProvider';
import { NoteEditor } from './NoteEditor';
import { LinksCard } from './LinksCard';

const DIFFICULTY_STYLES = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400',
  Hard: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400',
} as const;

const TIER_STYLES = {
  Core: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400',
  Supp: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  Stretch: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-400',
} as const;

const EVENT_TYPE_STYLES = {
  Solved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
  Revised: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-400',
  Revisited: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
} as const;

const formatDateTime = (d: Date) =>
  d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const [problem, tagRows, links] = await Promise.all([
    prisma.problem.findUnique({
      where: { id: params.id },
      include: {
        tags: true,
      stages: { include: { stage: true }, orderBy: { stage: { order: 'asc' } } },
      companies: { include: { company: true }, orderBy: { company: { name: 'asc' } } },
      reviews: { include: { stage: true }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }] },
      },
    }),
    prisma.tag.findMany({
      orderBy: [{ is_preset: 'desc' }, { created_at: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { problems: true } } },
    }),
    getProblemLinks(params.id),
  ]);
  if (!problem) notFound();
  const reviewCounts = { Solved: 0, Revised: 0, Revisited: 0 };
  for (const review of problem.reviews) reviewCounts[review.event_type]++;
  const tags = tagRows.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    isPreset: t.is_preset,
    count: t._count.problems,
  }));

  const onRoadmap = problem.stages.length > 0;

  return (
    <TagsProvider tags={tags}>
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
        <Link
          href="/roadmap"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Roadmap
        </Link>

        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
            {problem.source_link && (
              <a
                href={problem.source_link}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Open on LeetCode"
                title="Open on LeetCode"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {problem.leetcode_id !== null && <span>LC {problem.leetcode_id}</span>}
            {problem.difficulty ? (
              <Badge variant="outline" className={DIFFICULTY_STYLES[problem.difficulty]}>
                {problem.difficulty}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-dashed text-muted-foreground">
                Unknown
              </Badge>
            )}
            {problem.is_premium && <Lock className="size-3.5" aria-label="LeetCode Premium" />}
          </div>
          {problem.note && <p className="mt-3 text-sm italic text-muted-foreground">{problem.note}</p>}
          {problem.companies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {problem.companies.map((pc) => (
                <Badge key={pc.company_id} variant="secondary">
                  {pc.company.name}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Solved</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {onRoadmap ? (
              <ul className="flex flex-col gap-2">
                {problem.stages.map((placement) => (
                  <li key={placement.stage_id} className="flex flex-wrap items-center gap-2">
                    <SolvedCheckbox
                      problemId={problem.id}
                      stageId={placement.stage_id}
                      isSolved={placement.is_solved}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{placement.stage.stage_label}</span>
                      <span className="text-muted-foreground"> — {placement.stage.title}</span>
                    </span>
                    {placement.tier && (
                      <Badge variant="outline" className={TIER_STYLES[placement.tier]}>
                        {placement.tier}
                      </Badge>
                    )}
                    {placement.is_priority && (
                      <span className="text-amber-500" title="Priority">
                        ★
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2">
                <SolvedCheckbox problemId={problem.id} stageId={null} isSolved={problem.is_solved} />
                <span className="text-sm">Solved</span>
                <span className="text-xs text-muted-foreground">(not on the roadmap)</span>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Last solved:{' '}
              {problem.last_solved_date
                ? formatDateTime(problem.last_solved_date)
                : problem.is_solved
                  ? 'date unknown'
                  : '—'}
            </div>

            <div className="border-t pt-3">
              <RevisitButton problemId={problem.id} count={reviewCounts.Revisited} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              Confidence{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {!problem.is_solved
                  ? '— solve it first'
                  : problem.confidence
                    ? `— ${problem.confidence}/5, ${confidenceLabel(problem.confidence).toLowerCase()}`
                    : ''}
              </span>
            </CardTitle>
          </CardHeader>
          {problem.is_solved && (
            <CardContent>
              <ConfidencePicker problemId={problem.id} current={problem.confidence} showLabels />
            </CardContent>
          )}
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <ProblemTags
              problemId={problem.id}
              appliedIds={problem.tags.map((t) => t.tag_id)}
              variant="full"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your note</CardTitle>
          </CardHeader>
          <CardContent>
            <NoteEditor problemId={problem.id} initial={problem.user_note ?? ''} />
          </CardContent>
        </Card>

        <LinksCard problemId={problem.id} links={links} />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              History{' '}
              {problem.reviews.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {reviewCounts.Solved} solved · {reviewCounts.Revisited} revisited
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problem.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No solves or revisits recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {problem.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 first:border-t-0 first:pt-0"
                  >
                    <Badge variant="outline" className={cn('text-[11px]', EVENT_TYPE_STYLES[review.event_type])}>
                      {review.event_type}
                    </Badge>
                    <span>{review.solved_at ? formatDateTime(review.solved_at) : 'Date unknown'}</span>
                    {review.stage && (
                      <span className="text-muted-foreground">{review.stage.stage_label}</span>
                    )}
                    <span
                      className={cn(
                        'ml-auto text-xs',
                        review.confidence_at_time ? 'font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {review.confidence_at_time
                        ? `${review.confidence_at_time}/5 — ${confidenceLabel(review.confidence_at_time)}`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </TagsProvider>
  );
}
