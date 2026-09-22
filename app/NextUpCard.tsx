import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getNextUp } from '@/lib/nextUp';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';

const DIFFICULTY_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' } as const;

// One combined card: current stage's progress, the next 1-2 unsolved problems in roadmap order
// (reordered within the stage only when a preferred company asks one of them sooner), and a link
// out to the full roadmap. See spec 006 part B.
export async function NextUpCard() {
  const nextUp = await getNextUp();

  if (nextUp.done) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4 text-emerald-500" />
          Every roadmap problem is solved.
        </div>
        <Link
          href="/roadmap"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          View roadmap <ArrowRight className="size-3" />
        </Link>
      </div>
    );
  }

  const pct = nextUp.total > 0 ? (nextUp.solved / nextUp.total) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Next up</span>
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          View full roadmap <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="mt-2">
        {nextUp.groupTitle && <p className="text-xs text-muted-foreground">{nextUp.groupTitle}</p>}
        <h3 className="text-sm font-semibold leading-snug">
          {nextUp.stageLabel} — {nextUp.stageTitle}
        </h3>
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <ProgressBar value={pct} label={`${nextUp.solved} of ${nextUp.total} solved in this stage`} className="flex-1" />
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {nextUp.solved}/{nextUp.total}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {nextUp.problems.map((problem) => (
          <li key={problem.id}>
            <Link
              href={`/problems/${problem.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {problem.difficulty && (
                <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[problem.difficulty])} />
              )}
              <span className="min-w-0 truncate font-medium">{problem.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
