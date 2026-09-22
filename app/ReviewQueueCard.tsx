import Link from 'next/link';
import { getReviewQueue } from '@/lib/reviewQueue';
import { cn } from '@/lib/utils';

const DIFFICULTY_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' } as const;

function overdueLabel(daysOverdue: number): string {
  if (daysOverdue === Infinity) return 'date unknown';
  if (daysOverdue <= 0) return 'due today';
  return `${daysOverdue}d overdue`;
}

// Solved problems worth revisiting, most overdue first (spec 006 part D). Ordering and eligibility
// live in lib/reviewQueue.ts; this only renders the top slice and the total due count.
export async function ReviewQueueCard() {
  const queue = await getReviewQueue(5);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Review queue</span>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{queue.total} due</span>
      </div>

      {queue.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing due for review right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {queue.items.map((item) => (
            <li key={item.id} className="rounded-md transition-colors hover:bg-muted">
              <Link href={`/problems/${item.id}`} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                {item.difficulty && (
                  <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[item.difficulty])} />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {overdueLabel(item.daysOverdue)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {queue.total > queue.items.length && (
        <p className="mt-2 text-xs text-muted-foreground">+{queue.total - queue.items.length} more due</p>
      )}
    </div>
  );
}
