import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { ExternalLink, Info, Lightbulb, Lock } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PlacementRow } from './PlacementRow';
import { ProblemTags } from './ProblemTags';

export const stageInclude = {
  group: true,
  problems: { orderBy: { roadmap_order: 'asc' }, include: { problem: { include: { tags: true } } } },
} satisfies Prisma.StageInclude;

export type StageRow = Prisma.StageGetPayload<{ include: typeof stageInclude }>;

const DIFFICULTY_STYLES = {
  Easy: {
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  Medium: {
    chip: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
    dot: 'bg-amber-500',
  },
  Hard: {
    chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25',
    dot: 'bg-rose-500',
  },
} as const;

const TIER_STYLES = {
  Core: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/25',
  Supp: 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/25',
  Stretch: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/25',
} as const;

const CHIP = 'inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium ring-1 ring-inset';

// Inside a group the shared prefix is dropped: "Two Pointers — Opposite Direction" -> "Opposite Direction".
export function subTitle(stage: StageRow): string {
  const rest = stage.title.split(' — ').slice(1).join(' — ');
  return rest || stage.title;
}

export function stageCounts(stage: StageRow) {
  return {
    solved: stage.problems.filter((p) => p.is_solved).length,
    total: stage.problems.length,
  };
}

function Counter({ solved, total, wide = false }: { solved: number; total: number; wide?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <ProgressBar
        value={total > 0 ? (solved / total) * 100 : 0}
        label={`${solved} of ${total} solved`}
        className={cn('hidden sm:block', wide ? 'w-28' : 'w-16')}
        barClassName={solved === total && total > 0 ? 'bg-emerald-500' : undefined}
      />
      <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {solved}/{total}
      </span>
    </div>
  );
}

// The source data prefixes each insight with "Insight:"; the icon says that already.
function Insight({ text }: { text: string }) {
  const body = text.replace(/^Insight:\s*/i, '');
  if (!body) return null;
  return (
    <p className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
      <span>{body.charAt(0).toUpperCase() + body.slice(1)}</span>
    </p>
  );
}

function StageLabel({ label, bridge = false, quiet = false }: { label: string; bridge?: boolean; quiet?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        bridge
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
          : quiet
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary'
      )}
    >
      {label}
    </span>
  );
}

export type StageProblems = StageRow['problems'];

export function ProblemList({ problems }: { problems: StageProblems }) {
  return (
    <ul className="divide-y border-t">
      {problems.map((placement) => {
        const problem = placement.problem;
        return (
          <PlacementRow
            key={placement.problem_id + placement.stage_id}
            problemId={problem.id}
            stageId={placement.stage_id}
            isSolved={placement.is_solved}
            confidence={problem.confidence}
            meta={
              <>
                <span className="w-[4.5rem]">
                  {problem.difficulty ? (
                    <span className={cn(CHIP, DIFFICULTY_STYLES[problem.difficulty].chip)}>
                      <span className={cn('size-1.5 rounded-full', DIFFICULTY_STYLES[problem.difficulty].dot)} />
                      {problem.difficulty}
                    </span>
                  ) : (
                    <span className={cn(CHIP, 'border border-dashed text-muted-foreground ring-0')}>Unknown</span>
                  )}
                </span>
                <span className="w-[4.25rem]">
                  {placement.tier && <span className={cn(CHIP, TIER_STYLES[placement.tier])}>{placement.tier}</span>}
                </span>
              </>
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/problems/${problem.id}`}
                className={cn(
                  'min-w-0 truncate text-sm font-medium underline-offset-2 hover:text-primary hover:underline',
                  !placement.is_solved && 'text-foreground'
                )}
              >
                {problem.title}
              </Link>

              {placement.is_priority && (
                <span className="text-amber-500" title="Priority" aria-label="Priority">
                  ★
                </span>
              )}

              {problem.is_premium && (
                <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="LeetCode Premium" />
              )}

              {problem.note && (
                <Tooltip>
                  <TooltipTrigger className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0">
                    <Info className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{problem.note}</TooltipContent>
                </Tooltip>
              )}

              {problem.source_link && (
                <a
                  href={problem.source_link}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-muted-foreground/60 transition-colors hover:text-primary"
                  title="Open on LeetCode"
                  aria-label={`Open ${problem.title} on LeetCode`}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              <ProblemTags problemId={problem.id} appliedIds={problem.tags.map((t) => t.tag_id)} />
            </div>
          </PlacementRow>
        );
      })}
    </ul>
  );
}

// A stage that stands on its own (no group). `problems` is the rows to show (all of them unless a
// filter is on); the solved/total counter always reflects the whole stage.
export function StageCard({ stage, index, problems }: { stage: StageRow; index: number; problems: StageProblems }) {
  const { solved, total } = stageCounts(stage);
  return (
    <section
      id={`stage-${index}`}
      className={cn(
        'scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-xs',
        stage.is_bridge && 'border-violet-200 bg-violet-50/40 dark:border-violet-500/30 dark:bg-violet-500/5'
      )}
    >
      <header className="flex flex-col gap-2 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <StageLabel label={stage.stage_label} bridge={stage.is_bridge} />
          <h2 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{stage.title}</h2>
          <Counter solved={solved} total={total} />
        </div>
        <Insight text={stage.insight_note} />
      </header>
      <ProblemList problems={problems} />
    </section>
  );
}

// Sibling stages under one collective title (Stage 4A + 4B = "Two Pointers").
export function GroupCard({
  group,
  stages,
}: {
  group: { id: string; title: string };
  stages: { stage: StageRow; index: number; shown: StageProblems }[];
}) {
  const counts = stages.map(({ stage }) => stageCounts(stage));
  const solved = counts.reduce((sum, c) => sum + c.solved, 0);
  const total = counts.reduce((sum, c) => sum + c.total, 0);

  return (
    <section id={`group-${group.id}`} className="scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-xs">
      <header className="flex items-center gap-3 bg-muted/50 px-4 py-3.5 sm:px-5">
        <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight">{group.title}</h2>
        <span className="hidden text-xs text-muted-foreground sm:inline">{stages.length} stages</span>
        <Counter solved={solved} total={total} wide />
      </header>
      {stages.map(({ stage, index, shown }, i) => (
        <div key={stage.id} id={`stage-${index}`} className="scroll-mt-20 border-t">
          <div className="flex flex-col gap-2 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <StageLabel label={stage.stage_label} quiet />
              <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{subTitle(stage)}</h3>
              <Counter solved={counts[i].solved} total={counts[i].total} />
            </div>
            <Insight text={stage.insight_note} />
          </div>
          <ProblemList problems={shown} />
        </div>
      ))}
    </section>
  );
}
