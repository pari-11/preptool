// Pure month-calendar maths for the dashboard's activity card (spec 008 part C). No database or
// React in here, so the layout can be checked against fixtures. Days are bucketed by the *local*
// date, weeks start on Monday.

// Sources an event can come from, in display order. v3 (track / set) adds entries here.
export const ROADMAP_CATEGORY = 'roadmap';
export const COMPANY_LIST_CATEGORY = 'company-list';
export const ACTIVITY_CATEGORIES = [
  { key: ROADMAP_CATEGORY, label: 'Roadmap' },
  { key: COMPANY_LIST_CATEGORY, label: 'Company list' },
] as const;

// One review event. `categories` lists every source it belongs to: a solve of a roadmap problem
// that is also on a company list counts in both, the same way solving it advances progress in
// every set that contains it. The day's `total` still counts the event once.
export type ActivityEvent = {
  at: Date;
  categories: string[];
};

export type CalendarDay = {
  day: number; // day of the month, 1-31
  date: string; // local YYYY-MM-DD
  label: string; // "Sep 20"
  total: number; // events that day, each counted once
  byCategory: Record<string, number>; // events per source; can add up to more than `total`
  future: boolean; // after today: dimmed, never carries events
  today: boolean;
};

export type CalendarMonth = {
  key: string; // "YYYY-MM"
  title: string; // "September 2026"
  weeks: (CalendarDay | null)[][]; // Monday..Sunday; null pads before the 1st and after the last day
  total: number; // events in the month
  prevKey: string;
  nextKey: string | null; // null on the current month
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthKey(year: number, month: number): string {
  // Date normalises month -1 / 12 into the neighbouring year.
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// Monday = 0 ... Sunday = 6.
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/**
 * Which month to show. Anything that isn't a valid "YYYY-MM", or is after the current month, falls
 * back to the current month (there is nothing to show in the future).
 */
export function parseMonth(raw: string | undefined, today: Date = new Date()): { year: number; month: number } {
  const current = { year: today.getFullYear(), month: today.getMonth() };
  const match = raw ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw) : null;
  if (!match) return current;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  return year * 12 + month > current.year * 12 + current.month ? current : { year, month };
}

/** Local midnight of the 1st, and of the 1st of the next month (exclusive end) — for querying. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) };
}

export function buildMonth(
  events: ActivityEvent[],
  year: number,
  month: number,
  today: Date = new Date()
): CalendarMonth {
  const byDay = new Map<string, { total: number; byCategory: Record<string, number> }>();
  for (const event of events) {
    const key = dayKey(event.at);
    const day = byDay.get(key) ?? { total: 0, byCategory: {} };
    day.total++;
    // A category listed twice on one event still counts once.
    for (const category of new Set(event.categories)) {
      day.byCategory[category] = (day.byCategory[category] ?? 0) + 1;
    }
    byDay.set(key, day);
  }

  const todayKey = dayKey(today);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (CalendarDay | null)[] = Array.from({ length: mondayIndex(first) }, () => null);

  let total = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = dayKey(date);
    const future = key > todayKey; // YYYY-MM-DD strings compare in date order
    const found = future ? undefined : byDay.get(key);
    const dayTotal = found?.total ?? 0;
    total += dayTotal;
    cells.push({
      day,
      date: key,
      label: `${MONTHS[month].slice(0, 3)} ${day}`,
      total: dayTotal,
      byCategory: found?.byCategory ?? {},
      future,
      today: key === todayKey,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isCurrent = year === today.getFullYear() && month === today.getMonth();
  return {
    key: monthKey(year, month),
    title: `${MONTHS[month]} ${year}`,
    weeks,
    total,
    prevKey: monthKey(year, month - 1),
    nextKey: isCurrent ? null : monthKey(year, month + 1),
  };
}
