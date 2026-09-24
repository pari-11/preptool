import { prisma } from './prisma';
import {
  buildMonth,
  monthRange,
  parseMonth,
  ROADMAP_CATEGORY,
  COMPANY_LIST_CATEGORY,
  type ActivityEvent,
  type CalendarMonth,
} from './activityCalendar';

// An event belongs to every source its problem is in: "roadmap" if the problem sits in at least one
// stage (is_on_roadmap is computed from ProblemStage, never stored), and "company-list" if it is
// asked by at least one non-excluded company. A roadmap problem that a company also asks therefore
// shows both boxes on the day it was solved. v3 (per track / set) adds sources here, not to the
// calendar.
export async function getActivityMonth(rawMonth: string | undefined, today: Date = new Date()): Promise<CalendarMonth> {
  const { year, month } = parseMonth(rawMonth, today);
  const { start, end } = monthRange(year, month);
  // Rows with no date ("date unknown") can't be placed on a day, so they're left out.
  const rows = await prisma.reviewLog.findMany({
    where: { solved_at: { not: null, gte: start, lt: end } },
    select: {
      solved_at: true,
      problem: {
        select: {
          _count: { select: { stages: true, companies: { where: { company: { is_excluded: false } } } } },
        },
      },
    },
  });
  const events: ActivityEvent[] = rows.map((r) => {
    const categories: string[] = [];
    if (r.problem._count.stages > 0) categories.push(ROADMAP_CATEGORY);
    if (r.problem._count.companies > 0) categories.push(COMPANY_LIST_CATEGORY);
    return { at: r.solved_at as Date, categories };
  });
  return buildMonth(events, year, month, today);
}
