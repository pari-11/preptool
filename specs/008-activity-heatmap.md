# Spec 008 — Activity Heatmap → Activity Calendar (v1 single colour, v2 two colours, part C month calendar)

Status: v1 and v2 (the 26-week strip) were built and verified, then **replaced by Part C, the month calendar** at the user's request. Part C is built and verified on an isolated rig and with fixtures; not yet seen in the user's own browser. Parts A and B below describe the strip and are kept as the record of how it was reached; where Part C differs, Part C wins.
Depends on: 005 (`ReviewLog`), 006 (dashboard at `/`). Built on the review event types added after 005 (`Solved` / `Revised` / `Revisited`).
Phase: 2 (analytics core). Requested 2026-09-22 as the dashboard's "recent activity"; v1 of the three stages in CLAUDE.local.md.

## Goal

A LeetCode / GitHub-style calendar grid on the dashboard: one cell per day, shaded by how many review events landed on it, so a run of consistent days (or a gap) is visible at a glance.

## Scope

In scope (as built, after Part C): `lib/activity.ts` (the query), `lib/activityCalendar.ts` (the pure month builder, kept free of the database so it can be tested), `app/ActivityCalendarCard.tsx`, the card on `app/page.tsx`. Parts A and B were built as `lib/activityGrid.ts` and `app/ActivityHeatmapCard.tsx`, which Part C replaced and removed. v1 is single colour; v2 (Part B) colours by source; Part C is the month calendar. No schema change.

Out of scope: v3 (one colour per track/set) — the data shape leaves room for it but nothing renders it; streak counters; clicking a day to list what happened; a range picker.

## Decisions

1. **The unit is a `ReviewLog` row with a date** (`solved_at` not null), of any event type — a first solve, a "Revised" or a "Revisited". They are all activity; the heatmap counts events, not raw submissions the way LeetCode's does. A row with `solved_at = null` ("date unknown") can't be placed on a day and is skipped.
2. **Window: the last 26 weeks**, ending with the current week, weeks starting on Monday, columns left-to-right oldest to newest, rows Monday to Sunday. Days after today in the current week are left blank. 26 weeks (not 52) so the card fits in a half-width dashboard column without scrolling.
3. **Shading has four levels:** 0 events (empty), 1, 2, and 3 or more. Each level is a step of the accent colour (v1: one colour; v2: one per source, see Part B), readable in both light and dark themes.
4. **Days are bucketed by the server's local date**, not UTC, so a solve at 11pm lands on the day it happened for whoever runs the app. (The database stores UTC; this needs revisiting if it's ever hosted for users in other time zones — see Open items.)
5. **Categorisation is pluggable from v1.** Each event carries a `category` string and each cell keeps a per-category count alongside the total. v1 assigned every event the same category and rendered only the total; v2 (Part B) assigns two categories and colours by them, and v3 is the same step again rather than a rewrite. Nothing hardcodes "roadmap vs not" as the only axis.
6. **Accessibility and detail:** each cell has a tooltip/label ("3 events on Sep 20"), month labels sit above the columns, and a small "Less … More" legend explains the shades. A one-line summary ("41 events in the last 26 weeks") sits in the card header.

## Acceptance criteria

- [x] The number of events per day matches a `ReviewLog` count grouped by local date from the database.
- [x] Days with 0, 1, 2 and 3+ events render four distinct shades, and future days in the current week are blank.
- [x] Events older than 26 weeks and rows with a null date are not counted; nothing crashes on an empty log.
- [x] Week layout is correct (Monday at the top, current week last, no off-by-one at week or month boundaries) — checked with fixtures for a Monday, a Sunday and a month boundary.
- [x] The card fits its half-width dashboard column without a page-level horizontal scrollbar.
- [x] No schema change; no existing query or ranking code is touched.

## Verification

Checked on 2026-09-25. The live database was compared before and after: 40 log rows, 40 solved placements, unchanged.

- **Grid maths, with fixtures.** `lib/activityGrid.ts` has no database or React imports, so I compiled it with `tsc` and ran 20 checks in node: 26 weeks of 7 days, Monday at the top and Sunday last, the current week starting on Monday with Sat/Sun blank when today is a Friday, a whole visible week when today is Sunday, Monday-only when today is Monday, the oldest cell being a Monday 25 weeks back, the day before the window and a future-dated event both dropped, an empty log, three events on one local day (00:00, 12:00, 23:00) landing in one cell, a week straddling Aug 31 / Sep 1, and month labels that never overlap. All pass under `UTC`, `Asia/Kolkata`, `America/New_York`, `Europe/London` and `Pacific/Auckland`. The test script was a throwaway in a temp folder, not added to the repo (there is no test setup).
- **Counts vs SQL.** On a scratch copy of the database (`pg_dump` → scratch database, app copy on port 3100, both deleted afterwards) I added 123 synthetic `Revisited` rows spread over 5 months with 1–4 per day, one row with a null date and one 400 days old. The card's header read 163 events; a separate SQL count by local day (UTC → Asia/Calcutta, the machine's zone) gave 163, with 52 days with events on both sides and 0 per-day mismatches. The null-date row and the 400-day-old row were excluded.
- **Shading.** The grid had 128 empty, 14 one-event, 13 two-event and 25 three-plus cells, matching the counts by level; the four shades are visibly different in a headless-Chrome screenshot in both light and dark themes.
- **Layout.** In that screenshot (1200px wide) the card sits in the right half beside the progress card with month labels, weekday labels and the Less/More legend, and no page-level horizontal scrollbar.
- **No schema or existing-query change:** the diff adds three files and one card in `app/page.tsx`.

A mistake worth recording: my first SQL comparison showed a one-day shift on every row. That was the check, not the card — Prisma's `timestamp` column has no zone, so `AT TIME ZONE` has to convert from UTC first.

**Not verified:** the card in the user's own browser (the screenshots were headless Chrome against the rig); widths below about 1000px, where the grid falls back to its own horizontal scroll area rather than being reflowed; how it looks with the real data, which is 39 events on one day (Sep 20) and 1 on Sep 22, so it will be nearly empty at first.

## Part B — v2: two colours by source

Built 2026-09-25, after the user asked what had become of the multi-colour plan (v1 had been shipped alone, with v2 listed as a next candidate).

### Decisions

B1. **Two categories, in tie-break order: `roadmap`, then `company-list`.** An event is `roadmap` if its problem has at least one `ProblemStage` row (`is_on_roadmap`, computed, never stored) and `company-list` otherwise. Every problem outside the roadmap came from the company import, so nothing else can fall into the second bucket today.
B2. **A cell takes the colour of whichever category has more events that day; its depth (three steps) comes from the day's total, as in v1.** Ties go to the earlier category (roadmap). This keeps one colour per cell rather than a split square, which is unreadable at 11px.
B3. **Green for roadmap, violet for company-list**, each in three opacity steps, with the empty cell the same neutral for both. A key under the grid names the two colours, and the tooltip carries the exact split when a day has both ("3 events on Sep 20 (2 roadmap, 1 company list)"), so colour is never the only signal.
B4. **The categories live in one registry (`ACTIVITY_CATEGORIES` in `lib/activityGrid.ts`)** shared by the tie-break, the colour key and the tooltip. v3 adds entries there and a colour for each; an event whose category isn't registered still counts toward the total but has no colour of its own (it draws as the neutral cell), so a new category must be registered before it is emitted.

### Acceptance criteria

- [x] Roadmap and company-list events are told apart per problem, with no schema change.
- [x] A day with mostly roadmap events is green, mostly company-list is violet, and a tie is green.
- [x] Depth still follows the day's total (1, 2, 3+), and the tooltip shows the split when both sources appear.
- [x] The colour key names both colours and reads in light and dark.
- [x] Nothing changes for a log with only roadmap events (this is what the real data has).

### Verification

Checked 2026-09-25. Live database compared before and after: 40 log rows, 40 solved placements, 4 targeted companies, unchanged.

- **Fixtures:** eight more checks on the category logic (roadmap-dominant, company-dominant, tie, company-only, empty, an unregistered category never winning, totals still summing) pass under `UTC`, `Asia/Kolkata` and `America/New_York`; the 20 v1 checks still pass.
- **Against SQL:** on a scratch copy of the database I added 101 roadmap-problem rows and 66 rows for a company-list-only problem on overlapping days. For all 180 cells the card's total, colour class and tooltip split matched a separate SQL count per day (UTC → Asia/Calcutta): 112 empty, 35 roadmap-only, 16 company-only, 6 mixed with roadmap winning, 5 mixed with company winning and 6 mixed ties.
- **Visual:** headless-Chrome screenshots in light and dark show the two colours, three depths each and the key.

**Not verified:** the second colour on real data (there is none, see below); the card in the user's own browser; a colour-blindness check (green against violet was chosen to be distinguishable, and the tooltip carries the split, but no simulation was run).

### The catch (superseded by Part C6)

*This no longer holds: since C6, a roadmap solve also counts toward company-list whenever a company asks the problem, so violet appears on real data. What follows was true of the one-source-per-event rule.* Today the second colour can't appear on the user's real dashboard. The database holds 644 problems that are on no roadmap stage, but the only way to log a solve is the roadmap checkbox, which exists only for roadmap placements, and no `ReviewLog` row belongs to a non-roadmap problem. It starts to show once the company view (Phase 4 in CLAUDE.local.md) lets the user log a solve or revisit for a company-list problem.

## Part C — Month calendar with per-source boxes (replaces the strip)

Requested 2026-09-25: "make it like calendar boxes, and within each day's box we'll add these small boxes per category".

### Decisions

C1. **A month view, Monday-first**, showing the current month by default: a weekday header row, then one box per day, blank padding before the 1st and after the last day. The 26-week strip and the code that only served it (`buildHeatmap`, the shade levels, the tie-break colouring) are removed, not left unused.
C2. **Each day box shows its date number, and inside it one small box per source that has events that day** (roadmap, then company list — the registry order), coloured green and violet as in Part B and showing that source's count. A day with no events has just the number. Nothing is drawn for a source with zero events, so the boxes read as "what happened here" rather than a fixed legend of empty slots.
C3. **Month navigation is server-driven:** previous and next arrows plus a "Today" link, carried as `?month=YYYY-MM` on the dashboard URL. No client script. The next arrow is disabled on the current month (there is nothing in the future), an invalid or future `month` value falls back to the current month, and going backwards is unbounded (an empty past month is harmless).
C4. **Today is outlined; days after today are dimmed and never carry boxes.** The header shows the month's total events. Each day box has a tooltip and accessible label with the total and the split when both sources appear ("3 events on Sep 20 (2 roadmap, 1 company list)").
C6. **A solve counts in every source its problem belongs to** (requested 2026-09-25: whenever a roadmap question is completed and also matches something in a company list, the company-list box appears in that day too). So a roadmap problem that at least one non-excluded company asks adds one to the roadmap box **and** one to the company-list box, the way solving it advances progress in every set that contains it (CLAUDE.local.md Part 2); a problem in only one source adds to that one. The day's total and the header count each event once, so the small boxes can add up to more than the total, and the tooltip reads "2 events on Sep 2: 2 roadmap, 1 company list". "Company list" means any non-excluded company, not only the user's targets. This supersedes Part B's one-source-per-event rule (B1), and it makes the violet box appear on real data: 134 of the 154 roadmap problems, and 36 of the 40 solved so far, are on a company list.
C5. **Everything else from A and B stands:** any dated `ReviewLog` row counts, days are the server's local date, source comes from whether the problem has a `ProblemStage` row, no schema change. The colour key stays under the grid.

### Acceptance criteria

- [x] Each day's count per source matches a SQL count by local date for that month.
- [x] Layout is right for months that start on each weekday and for 28-, 29-, 30- and 31-day months (checked with fixtures, including a leap February and a month that needs six rows).
- [x] The current month opens by default, the arrows step one month back and forward, the next arrow is off on the current month, and a garbage or future `month` value shows the current month.
- [x] Only sources with events get a small box; future days have none; today is outlined.
- [x] The card fits its half-width dashboard column in light and dark with no horizontal scrollbar.
- [x] No schema change; the strip's code is gone and nothing else referenced it.
- [x] A roadmap problem that a company also asks shows both boxes on the day it is solved; roadmap-only shows green only; company-only shows violet only; a company that is excluded doesn't create a violet box; the day's total counts each event once.
- [x] Ticking a roadmap problem through the app's own checkbox action puts both boxes on today.

### Verification

Checked 2026-09-25.

- **Layout fixtures:** 25 checks in node on `lib/activityCalendar.ts` (compiled with `tsc`, no database). Every month of 2026 and 2027 lays out with Monday-first padding and the right row count, checked against `Date.getDay` as an independent oracle; all seven weekdays occur as the 1st; Feb 2026 (28 days, starts Sunday, 5 rows), Feb 2027 (28 days, starts Monday, exactly 4 rows), Feb 2028 (leap, 29 days) and Aug 2026 (31 days, starts Saturday, 6 rows); today is marked and later days are future and empty; a future-dated event is dropped; events on three local moments of one day (00:00, 12:00, 23:00) land in one box; an event from another month is ignored; `month` parsing (garbage, `2026-13`, `2026-9`, a full date, a future month all fall back to the current month); previous/next keys across the year boundary. All pass under `UTC`, `Asia/Kolkata`, `America/New_York`, `Europe/London` and `Pacific/Auckland`. The script was a throwaway in a temp folder, not added to the repo.
- **Against SQL, on a scratch copy of the database** (`pg_dump` → scratch database, app copy on port 3100, both deleted afterwards) with 123 synthetic roadmap and company-list events across August and September: for September, 30 days, 17 with boxes, a header of 78 events equal to the sum of the day totals; for August, 31 days, 21 with boxes, 53 events; March was empty (0). Every day's roadmap and company-list counts matched a separate SQL count by local day (UTC → Asia/Calcutta), with 0 mismatches.
- **Navigation:** on the current month the previous link goes to `?month=2026-08`, there is no next link and no Today link; on August the next link goes to `/` (the current month) and a Today link appears; on March both arrows exist. `?month=2026-10` (future) and `?month=garbage` both rendered September 2026.
- **Visual:** headless-Chrome screenshots in light and dark: the day boxes, small green/violet count boxes, outlined today, dimmed future days, an August with six rows, and the colour key, with no horizontal scrollbar at 1200px wide.
- **Live dashboard, after the data change below:** a read-only request to the running server showed September 2026 with 1 event (Sep 22) and nothing else.
- **Overlapping sources (C6), fixtures:** six more checks — a roadmap problem also asked by a company counts in both boxes and once in the total; box counts can exceed the total (5 boxes on 3 events); company-only has no roadmap key; a category listed twice on one event counts once; an event in no source still counts in the total with no boxes; the month total counts events once (6, not the sum of boxes). Pass under all five time zones, with the 25 earlier checks.
- **Overlapping sources, against SQL on a scratch rig:** four kinds of synthetic events (a solved roadmap problem asked by companies, a roadmap-only problem no company asks, a company-only problem, and a roadmap problem whose only company I marked excluded on the scratch copy) over August and September. Every day's total, roadmap count and company-list count matched a separate SQL count (0 mismatches over 61 days), including 9 September days and 6 August days where the boxes add up to more than the total. The tooltip reads e.g. "2 events on Sep 2: 2 roadmap, 1 company list".
- **The requested flow:** ticking an unsolved roadmap problem (Valid Parentheses, asked by 13 companies) through the app's own checkbox action on the scratch rig raised the log by one row and today's box read "1 event on Sep 25: 1 roadmap, 1 company list", shown as a green and a violet box in the screenshot.
- **Dashboard layout:** the taller calendar first stretched the progress card beside it; top-aligning the cards (`items-start`) then left an empty gap under the progress card, with the review queue stranded in a row below the calendar (the user's screenshot flagged it). A first fix stacked progress and the review queue beside the calendar, but the Next up card above was still stretched to the height of "Your companies" next to it. The layout was then reworked twice more at the user's request (see the dashboard layout note in spec 006 for the final version): Next up and the review queue side by side in a compact top row, then progress and Your companies stacked on the left beside the calendar on the right, each card only as tall as its content. On a phone the order is Next up, review queue, progress, your companies, calendar.

**Not verified:** the calendar in the user's own browser; widths below the two-column breakpoint (the cards stack there and the calendar simply fills the width, not looked at); the case of a category that isn't registered in `ACTIVITY_CATEGORIES`, which by design counts in the day's total but draws no small box.

### Data change on the user's live database (2026-09-25)

The user asked to remove the 20th of September from the calendar: the 39 solves on that date were ticked in one sitting from their notes, not solved that day, and they will give exact dates later. I did this by setting `ReviewLog.solved_at` to null on exactly those 39 `Solved` rows (local day 2026-09-20 in Asia/Kolkata; the same rows are 2026-09-20 in UTC), in one transaction, after a full `pg_dump` and saving each row's original id and timestamp. That is the schema's existing "date unknown" state, so nothing was deleted: all 40 log rows remain, the 40 solved placements and `Problem.last_solved_date` / `last_reviewed_date` are unchanged, the review queue is unaffected (it reads the problem-level dates), and the problem page shows "Date unknown" for these rows. The one Sep 22 row was left alone.

A second, identical change was made the same day when the user asked to remove the 22nd as well: the one remaining dated row (Sep 22, id `cmucahrf60003tauptg1ntb1h`) also had its `solved_at` set to null, after another full backup and again in a transaction. All 40 log rows now have an unknown date, so the live calendar is empty until new solves are logged or real dates are supplied; the live counts afterwards were 40 log rows, 0 dated, 40 solved placements.

When the user supplies the real dates, set `solved_at` on those rows (by problem) and the calendar picks them up with no code change. The backup and the original timestamps are in the session's scratch folder, which is temporary; nothing sensitive was written into the repo.

## Open items

- **Time zone.** Local-date bucketing is right for one person running the app on their own machine. A hosted multi-user version needs each user's time zone (or a stored one).
- **None of the user's first 40 solves has a real date.** 39 were ticked in on 2026-09-20 and one on 2026-09-22; all their dates were cleared on 2026-09-25 (see the data change above). The calendar shows only events with a known day until the user supplies the actual dates, and new solves land on their real day as they are logged.
- **"Company list" means any non-excluded company** (C6), so almost every roadmap solve gets a violet box beside its green one. If that turns out to be noise, the alternative is to count only the user's target companies (`is_preferred`), which is a one-line change to the query in `lib/activity.ts` — not decided here.
- Whether "Revisited" clicks should count the same as real solves in the shading is a judgement call to revisit once there's real use; v2/v3 can weight or split them.
