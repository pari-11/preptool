import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getRoadmapStats } from '@/lib/roadmapStats';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { NextUpCard } from './NextUpCard';
import { ReviewQueueCard } from './ReviewQueueCard';
import { TargetCompaniesCard } from './TargetCompaniesCard';
import { ActivityCalendarCard } from './ActivityCalendarCard';
import { StrengthsWeaknessesCard } from './StrengthsWeaknessesCard';

// Progress at a glance, minimized: the same numbers the roadmap page's four tiles show (see
// lib/roadmapStats.ts), condensed into one card since the dashboard has other sections to fit.
// Full breakdown stays on /roadmap, which is LeetCode-specific; this card is deliberately generic
// so later tracks (DBMS, OS, ...) have somewhere to sit beside it without crowding this one.
async function RoadmapProgressCard() {
  const stats = await getRoadmapStats();
  const pct = stats.totalCount > 0 ? (stats.solvedCount / stats.totalCount) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">DSA Roadmap progress</span>
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          View roadmap <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{stats.solvedCount}</span>
        <span className="text-sm tabular-nums text-muted-foreground">/ {stats.totalCount} solved</span>
        <span className="ml-auto text-sm tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
      </div>
      <ProgressBar value={pct} label={`${stats.solvedCount} of ${stats.totalCount} solved`} className="mt-3" />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {stats.byDifficulty.map((d) => (
          <span key={d.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', d.dot)} />
            {d.key}
            <span className="tabular-nums text-foreground">
              {d.solved}/{d.total}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: { month?: string } }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where things stand, and what's worth looking at next.
        </p>
      </header>

      {/* Target companies gets its own thin column on the right: that list only grows, and
          squeezing it into a shared row/column meant either capping it short or letting it push
          everything else around. Everything else sits in the wider main column and shifts left. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          {/* The two "what to do now" cards sit side by side and stay compact. They are similar
              in height, so aligned rows don't leave gaps here. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NextUpCard />
            <ReviewQueueCard />
          </div>

          {/* Independent columns rather than aligned rows: the calendar is taller than progress +
              strengths/weaknesses stacked, and a row would stretch the short one into empty space. */}
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <RoadmapProgressCard />
              <StrengthsWeaknessesCard />
            </div>
            <ActivityCalendarCard month={searchParams.month} />
          </div>
        </div>

        <TargetCompaniesCard />
      </div>
    </div>
  );
}
