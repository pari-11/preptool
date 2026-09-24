import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivityMonth } from '@/lib/activity';
import {
  ACTIVITY_CATEGORIES,
  COMPANY_LIST_CATEGORY,
  ROADMAP_CATEGORY,
  monthKey,
  type CalendarDay,
} from '@/lib/activityCalendar';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// One colour per source. Full class names so Tailwind can see them; 600 keeps the white count
// readable in both themes.
const BOX: Record<string, string> = {
  [ROADMAP_CATEGORY]: 'bg-emerald-600',
  [COMPANY_LIST_CATEGORY]: 'bg-violet-600',
};

function dayLabel(day: CalendarDay): string {
  const events = `${day.total} ${day.total === 1 ? 'event' : 'events'} on ${day.label}`;
  // A solve can count in both sources, so the split can add up to more than the total.
  const split = ACTIVITY_CATEGORIES.filter(({ key }) => day.byCategory[key]).map(
    ({ key, label }) => `${day.byCategory[key]} ${label.toLowerCase()}`
  );
  return split.length > 0 ? `${events}: ${split.join(', ')}` : events;
}

// The dashboard's current-month calendar: a box per day with a small box per source that has
// events, holding that source's count (spec 008 part C). Month navigation is a `?month=` link.
export async function ActivityCalendarCard({ month }: { month?: string }) {
  const calendar = await getActivityMonth(month);
  const today = new Date();
  const currentKey = monthKey(today.getFullYear(), today.getMonth());
  const href = (key: string) => (key === currentKey ? '/' : `/?month=${key}`);
  const navClass = 'flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors';

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link href={href(calendar.prevKey)} aria-label="Previous month" className={cn(navClass, 'hover:bg-muted hover:text-foreground')}>
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-[8.5rem] text-center text-sm font-semibold">{calendar.title}</span>
          {calendar.nextKey ? (
            <Link href={href(calendar.nextKey)} aria-label="Next month" className={cn(navClass, 'hover:bg-muted hover:text-foreground')}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(navClass, 'opacity-30')}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          {calendar.key !== currentKey && (
            <Link href="/" className="text-primary underline-offset-2 hover:underline">
              Today
            </Link>
          )}
          <span className="tabular-nums">
            {calendar.total} {calendar.total === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendar.weeks.flat().map((day, i) =>
          day === null ? (
            <span key={`pad-${i}`} aria-hidden />
          ) : (
            <div
              key={day.date}
              title={day.total > 0 ? dayLabel(day) : undefined}
              aria-label={dayLabel(day)}
              className={cn(
                'flex h-[3.25rem] min-w-0 flex-col rounded-md border bg-muted/30 p-1',
                day.today && 'border-primary',
                day.future && 'opacity-40'
              )}
            >
              <span className={cn('text-[10px] leading-none', day.today ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {day.day}
              </span>
              <div className="mt-auto flex flex-wrap gap-0.5">
                {ACTIVITY_CATEGORIES.map(({ key }) =>
                  day.byCategory[key] ? (
                    <span
                      key={key}
                      className={cn(
                        'inline-flex h-4 min-w-4 items-center justify-center rounded-[3px] px-1 text-[9px] font-semibold leading-none text-white',
                        BOX[key]
                      )}
                    >
                      {day.byCategory[key]}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        {ACTIVITY_CATEGORIES.map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-[2px]', BOX[key])} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
