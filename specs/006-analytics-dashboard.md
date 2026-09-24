# Spec 006 — Analytics Dashboard Becomes the Homepage

Status: Parts A, B, C built and verified. Part D built, then redesigned twice past what its own text below describes (see the note at the top of Part D) — **needs a closer look before it's called done.** Part F built and verified on an isolated rig, with its UI on a new `/profile` page rather than the dashboard (see Part F); not yet clicked through in a real browser. Part E not started.
Depends on: 003 (roadmap data), 004 (roadmap view), 005 (confidence, `ReviewLog`, tags, filters, company `is_preferred`).
Phase: 2 of the plan. Reads what spec 005 recorded (confidence, `last_solved_date`, `ReviewLog`) and the company layer from spec 005 part F (`Company.is_preferred`). No new schema — everything in this spec is query logic and UI over fields that already exist.

## Goal

The roadmap page moves to its own route (`/roadmap`) and stays exactly what it is today — a full list to browse and filter, LeetCode-specific stat tiles and all. A new dashboard at `/` answers "what should I look at right now" without opening the roadmap: what to do next, how things are going overall (in miniature — the roadmap keeps the full breakdown), what needs revisiting, where the gaps are, and which companies to weight.

## Decisions settled for this spec

These were the three open items named when this spec was requested. They're written as **proposed defaults** in the style of spec 005 decisions 8–10: reasoned through now, not separately confirmed line by line, and open to being revisited once there's real queue/strengths data to look at.

**Review-queue interval mapping (rating → days before it resurfaces).** The vision doc's own note is the anchor: the old 1–3 scale was 1 = always, 2 = ~1 week, 3 = ~3–4 weeks, and five levels should expand the intervals rather than compress them. Proposed mapping, in `lib/reviewQueue.ts`:

| confidence | days until due |
|---|---|
| 1 (couldn't solve it) | 0 — always due |
| 2 (needed the solution) | 3 |
| 3 (lots of struggle or hints) | 7 |
| 4 (some hesitation) | 14 |
| 5 (got it cold) | 30 |
| unrated (solved, `confidence = null`) | 0 — always due |
| `solved_at = null` ("date unknown") | 0 — always due (staleness can't be computed; none exist today, but the code must not throw on one) |

Unrated is treated as urgently as a 1 on purpose: it keeps unrated solves visible in the queue instead of letting them go quiet, which is the nudge the load-bearing-confidence problem in CLAUDE.local.md asks for.

**Strengths/weaknesses minimum sample.** `n ≥ 3` solved placements in a stage (or stage group), per CLAUDE.local.md's own figure. Below that, the stage is **not reached** regardless of how those 1–2 solves went.

**"Current stage" for the preview card.** The first `Stage` in roadmap `order` ascending that has at least one placement with `is_solved = false`. This is stage-level, not group-level — `StageGroup` stays a display wrapper, and progression is tracked per stage exactly as the checkboxes are. If every stage is fully solved, the card shows a completion state instead of a progress bar.

## Part A — Routing: dashboard at `/`, roadmap at `/roadmap`

### Decisions

A1. **Only route files move.** `app/page.tsx`'s roadmap content moves to `app/roadmap/page.tsx`. The components it imports (`StageSection.tsx`, `PlacementRow.tsx`, `RoadmapShell.tsx`, `RoadmapNav.tsx`, `RoadmapFilters.tsx`, `CompanyWise.tsx`, `TagsProvider.tsx`, etc.) **stay under `app/`** rather than moving into `app/roadmap/` — Next.js doesn't require colocation, and moving them buys nothing here while touching every relative import. Their relative imports from the new `app/roadmap/page.tsx` change from `./X` to `../X`.
A2. **Every hardcoded `/roadmap`-as-`/` link is updated**, not left to redirect: `lib/roadmapFilters.ts` (`filtersHref`'s bare `/` and `` `/?${text}` ``), `app/RoadmapFilters.tsx` (two `Link href="/"`), the roadmap page's own "Clear all filters" link, and `app/problems/[id]/page.tsx`'s "← Roadmap" back link.
A3. **`AppHeader`** gets a second nav item, "Dashboard" (`/`, exact match only) alongside "Roadmap" (`/roadmap`, active on `/roadmap` and `/problems/*` — a problem detail page is roadmap-adjacent wherever it was reached from).
A4. **No redirect from the old root.** Once `app/page.tsx` is the dashboard, there is no old roadmap URL to preserve — anyone with `/` bookmarked now gets the dashboard, which is the intended change.

### Scope

In scope: moving the file, the import-path fixes, the header nav, the four link updates in A2.

Out of scope: any visual change to the roadmap page itself beyond what Part C removes from it (below); a redirect or alias for the old behaviour of `/`.

### Acceptance criteria

- [x] `/roadmap` renders exactly what `/` used to (stages, groups, filters, sidebar, CompanyWise), with `npx tsc --noEmit` clean after the move.
- [x] `/` renders the new dashboard. (Only Part C's card exists there so far; B/D/E/F land in later `/implement` passes.)
- [x] All four updated links (filter clear, both `RoadmapFilters.tsx` links, the problem-page back link) point at `/roadmap`. *(Checked via source read and curl on 2026-09-22, then confirmed by the user clicking through the real app the same day.)*
- [x] The header highlights "Dashboard" only on `/`, and "Roadmap" on `/roadmap` and on a problem detail page.
- [x] A bookmarked filtered roadmap URL (e.g. `/?status=unsolved&difficulty=Easy`) is not expected to keep working — confirmed nothing in the app still generates a filter link at the old path (`grep` for `href="/?` and `href="/"` across `app/` turned up nothing but the header's brand link, which correctly points at the new dashboard).

### Verification

Checked 2026-09-22 against the running app and the live Docker database (read-only — no writes were tested or needed for this step). The dev server was started on port 3001 (3000 was already in use by the user's own instance, left untouched) and stopped by PID afterwards, not by image name. `curl` confirmed `/` and `/roadmap` both return 200, a stale route returns 404, the header's `aria-current="page"` lands on the right tab in both places (including from `/problems/[id]`), and the dashboard's and roadmap's progress numbers are byte-identical (40/154 solved, same per-difficulty split) since both now call `lib/roadmapStats.ts`. Not verified: any real click (only HTTP requests and static `grep`/source reads).

## Part B — Next up + roadmap preview card

### Goal

One glance answers "where am I, and what's the next thing to solve" without opening the roadmap.

### Decisions

B1. Current stage = the settled definition above. Its progress bar shows that stage's own solved/total (not the group's combined count), so it matches the stage the "next unsolved" list is drawn from. If the stage belongs to a `StageGroup`, the card shows the group title with the stage's own label underneath (`"Two Pointers · 4A — Opposite Direction"`), reusing the `subTitle(stage)` convention from `StageSection.tsx`.
B2. **The next 1–2 unsolved problems are drawn only from the current stage**, in `roadmap_order` ascending — not padded from the following stage if the current one has just one left. Pairing the list with "this stage's" progress bar would be misleading otherwise.
B3. **Personalisation reorders the pick, never the stage.** Among the current stage's unsolved placements, one asked by a preferred company (`Company.is_preferred`) sorts before one that isn't, ties broken by `roadmap_order`; with no preferred companies set, this is a no-op and the plain `roadmap_order` applies. This is the "reorders, never unlocks" rule from CLAUDE.local.md Part 1 applied literally: the candidate pool never leaves the current stage.
B4. Each listed problem links straight to `/problems/[id]`; "View full roadmap →" links to `/roadmap` (no deep link to the stage's anchor — computing that anchor id depends on the roadmap page's own filter/grouping state, which the dashboard shouldn't have to duplicate).
B5. **Roadmap fully solved:** the card shows a completion message instead of a progress bar and an empty next-up list, rather than erroring on "no current stage".

### Scope

In scope: `lib/nextUp.ts` (finds the current stage, its progress, and the ranked next 1–2 placements, taking the set of preferred company ids); `app/NextUpCard.tsx` on the dashboard.

Out of scope: a "skip this problem" action; showing more than 2 problems; cross-stage lookahead.

### Acceptance criteria

- [x] With no preferred companies, the card shows the first stage (in `order`) with any unsolved placement, its own solved/total bar, and up to 2 unsolved problems from it in `roadmap_order`, matching a direct database query.
- [x] With a preferred company asking one of that stage's later-ordered unsolved problems, that problem moves ahead of an earlier-ordered one **within the same stage's list** — and a problem from a different, earlier-ordered stage is never pulled in ahead of it.
- [x] A fully-solved roadmap renders the completion state, not an error. *(Checked by code inspection — `Array.prototype.find` returning `undefined` and the `!current` guard — not exercised live, since reaching that state would mean writing to the user's real progress, which is off-limits.)*
- [x] A stage whose only unsolved problems are all in a `StageGroup` shows the group title alongside the stage label.
- [x] "View full roadmap →" opens `/roadmap`; each problem link opens the right `/problems/[id]`.

### Verification

Checked 2026-09-22, read-only against the live database, dev server on a scratch port (3101, stopped by PID afterwards). Direct-query script (`getRoadmapStats`-style, deleted after use) confirmed: the current stage is Stage 8A ("Matching & Simulation", grouped under "Stack"), 0/5 solved, every stage before it in `order` fully solved, and the next two unsolved by `roadmap_order` are Valid Parentheses (41) and Min Stack (42) — all matching the rendered card exactly. The reordering rule (B3) was verified separately as a pure-logic fixture test against `rankUnsolved` (extracted from `getNextUp` for this purpose): a later-ordered placement tagged with a preferred company moved ahead of an earlier one but not past a still-later one, and an empty preferred set left `roadmap_order` untouched — no live data involved, since no companies are currently starred. Not verified: any real click; the completion state (B5), which was checked by reading the code rather than triggered live.

## Part C — Progress at a glance

### Decisions

C1. **Changed 2026-09-22, before build (the user's call, overriding this spec's first draft):** the four stat tiles (Solved / Easy / Medium / Hard) **stay on the roadmap page, unchanged** — they're LeetCode-specific, and the roadmap is the LeetCode-specific screen. The dashboard gets a **minimized version** instead, since it has to share space with the other sections in this spec (and, later, other tracks).
C2. **The two pages share one computation** so they can't drift apart: `lib/roadmapStats.ts` exports `getRoadmapStats()` (distinct problems across placements, so LC 268 counts once) and both `/roadmap` and `/` call it. The roadmap page was refactored to call it too, rather than keeping its own inline copy, specifically so this couldn't silently diverge later.
C3. **The minimized card is one compact block, not four small tiles**: a hero "N / total solved" figure with an overall %, one progress bar, and a row of small colour-dot stats (Easy/Medium/Hard, each `solved/total`) underneath — reusing the exact dot colours already used everywhere else for difficulty (`DIFFICULTY_META` in `lib/roadmapStats.ts`), so nothing new is introduced there. It links out with "View roadmap →". Titled "DSA Roadmap progress" (not just "Progress") on purpose — CLAUDE.local.md Part 1 says DSA is one track among several, and this card is scoped to DSA specifically so a second track's card can sit beside it later without the two being confused.

### Scope

In scope: `lib/roadmapStats.ts` (the shared stats function, moved out of the old `app/page.tsx`); `app/roadmap/page.tsx` keeping its `StatTile` component and four-tile section, now fed by the shared function; the new `app/page.tsx` dashboard's `RoadmapProgressCard`, an async Server Component reading the same function.

Out of scope: tier or stage-strip breakdowns (CLAUDE.local.md lists these as later additions to this same section, not required now); per-set or per-track stats (no `ProblemSet`/`Track` yet); a second track's card (nothing to show yet, but C3's naming leaves room for it).

### Acceptance criteria

- [x] The roadmap page's four tiles are unchanged in appearance and behaviour from before this spec.
- [x] The dashboard's minimized card shows numbers identical to the roadmap page's tiles, sourced from the same function — not just coincidentally equal.
- [x] The roadmap page's stat-tile section still renders after the refactor to the shared function (i.e. the refactor didn't silently drop it, which is what the first draft of this spec would have done).

### Verification

Checked 2026-09-22 (see Part A's Verification — same session, same server, read-only against the live database). `curl` dumps of both pages' HTML were compared line-by-line for the progress numbers: roadmap tiles read 40/154 solved, Easy 14/35, Medium 22/104, Hard 4/15; the dashboard card reads the identical 40/154, 26%, and the same three difficulty splits. Not verified: the card's appearance (colour, spacing, dark mode) in an actual browser — only the rendered HTML and class names were checked.

## Part D — Review queue

**⚠ Revisit later.** Everything below is what this spec originally scoped and it's still the ranking logic actually running (`lib/reviewQueue.ts` — `isDue`, `daysOverdue`, `rankQueue` — is unchanged from D1–D4). But the *interaction* shipped, then went through two more redesigns the spec was never updated for:
- A `ReviewEventType` enum (`Solved` / `Revised` / `Revisited`) and `Problem.last_reviewed_date` were added (migration `add_review_event_types`) so a "just looked at it again" event could reset the staleness clock without pretending it was a fresh solve.
- The UI tried per-event icons, then checkboxes, then settled on **one "Revisited?" counter button with an undo** (`app/RevisitButton.tsx`) — logging a `Revisited` event and bumping `last_reviewed_date`. The Re-solve button and the overdue-days label were both removed along the way.
- None of the acceptance criteria below were re-verified against that final shape, and the live database currently has **0 rated problems**, so the interval mapping has never been exercised against real data — only against the ranking-logic fixtures noted in each item.

Come back to this once there's real rated/revisited data to judge it against, and either update the criteria to match what's actually there or decide the interaction needs another pass.

### Goal

Surface solved problems worth revisiting, ordered by how overdue they are.

### Decisions

D1. Eligibility: `Problem.is_solved = true` only (the roll-up — a problem solved in any placement is eligible once, not once per placement).
D2. Due check: `last_solved_date + intervalDays(confidence) <= today`, using the mapping settled above, read from `Problem.confidence` and `Problem.last_solved_date` (the problem-level fields — review state attaches to the problem's identity, same as confidence itself, not to a placement).
D3. Ordering: most-overdue first (`today − dueDate`, descending); ties broken by lower confidence first, then by `last_solved_date` ascending (older solve first).
D4. **Company priority reorders within the due set, same rule as Part B:** a due problem asked by a preferred company sorts ahead of an equally-overdue one that isn't, but never ahead of something more overdue. This is Part F's ranking signal, not a separate mechanism.
D5. The dashboard shows the top 3 due items (changed from 5 on 2026-09-25 so the card can sit beside Next up and leave room for more cards) and a total due count; there's no dedicated `/review` route yet — if the list is worth a full page later, that's a follow-up, not part of this spec.

### Scope

In scope: `lib/reviewQueue.ts` (the interval table, `isDue`, `daysOverdue`, `getReviewQueue(preferredCompanyIds, limit)`); `app/ReviewQueueCard.tsx`.

Out of scope: a full `/review` page; snoozing or dismissing a queue item; using per-stage `ReviewLog` history instead of the problem-level fields (D2 already reasons why the problem-level fields are the right grain).

### Acceptance criteria

- [ ] A problem rated 1 (or unrated) and solved today shows as due today; one rated 5 and solved today does not show until 30 days out — checked by comparing `isDue` output against hand-computed dates for each of the 6 rows in the mapping table (including unrated and, if constructible, a null `solved_at`).
- [ ] The queue orders by days-overdue descending, verified against a hand-built small fixture (a scratch-database check, not the live data).
- [ ] A preferred-company problem moves ahead of an equally-overdue non-preferred one, and not ahead of a more-overdue one.
- [ ] The card shows "N due" and truncates the list to 5 with the total still visible when more are due.
- [ ] An unsolved problem never appears in the queue regardless of any stale `confidence`/`last_solved_date` left over from a previous solve-then-untick.

## Part E — Strengths & weaknesses

### Goal

Show where preparation is actually solid versus where it looks done but isn't, without treating "not attempted yet" as a weakness.

### Decisions

E1. **Unit of aggregation: `Stage`, merged into its `StageGroup` where one exists** (the same 11-groups-plus-13-standalone breakdown the roadmap already renders) — the only topical grouping that exists before `Track`/pattern data does.
E2. **Sample membership uses the placement**, not the problem roll-up: a placement counts toward its stage's sample only if `ProblemStage.is_solved = true` for that placement, matching how solved state is scoped everywhere else in the app.
E3. **States**, in order of precedence:
   - **not reached** — fewer than 3 solved placements in the stage/group.
   - **strong** — ≥3 solved, the average of `Problem.confidence` over the *rated* ones is ≥4, and none of the group's problems are currently due per Part D's `isDue`.
   - **weak** — ≥3 solved and not strong (this covers a low average, several low ratings, an all-unrated group, and a good-but-stale average alike — anything short of confidently strong is worth a second look, which is what this section is for).
E4. A group with solved placements but zero ratings among them is **weak**, not "not reached" — it has a sample, it's just unrated, and burying that would hide exactly the unrated-solve problem CLAUDE.local.md calls out.

### Scope

In scope: `lib/strengthsWeaknesses.ts` (the constants — `MIN_SAMPLE = 3`, `STRONG_AVG_THRESHOLD = 4` — and the per-stage/group aggregation, reusing `isDue` from Part D); `app/StrengthsWeaknesses.tsx` on the dashboard, grouping stages the same way `StageSection.tsx` already does for rendering.

Out of scope: per-tag or per-company strengths; anything below stage/group grain (no `Track` or pattern data yet); a detail drill-down page (the roadmap page already shows the underlying rows).

### Acceptance criteria

- [ ] A stage with 2 solved placements shows "not reached" regardless of their ratings.
- [ ] A stage with 3+ solved, all rated 5, none due, shows "strong".
- [ ] A stage with 3+ solved, all rated 5 but one now overdue per the review queue, shows "weak" (E3's staleness clause), verified against the same fixture as Part D.
- [ ] A stage with 3+ solved and no ratings at all shows "weak", not "not reached".
- [ ] A `StageGroup`'s state is computed over all its member stages' placements combined, matching a hand-summed count from the database.
- [ ] All three states render distinctly (not just a percentage) and every stage/group appears in exactly one bucket.

## Part F — Personalisation (target companies)

### Goal

Let target companies be declared once and have that declaration bend `next up` and the review queue toward them, without ever unlocking anything out of roadmap order.

### Decisions

F1. **No new schema.** "Target company" is exactly `Company.is_preferred`, already used by the roadmap's CompanyWise chips (spec 005 part F). This section is a second surface for the same flag, not a new concept.
F2. **The picker lives on a profile page, not the dashboard** (revised at build time, at the user's direction). `/profile` is a new route, linked from the right-hand side of the header beside the theme toggle (not in the left nav with Dashboard/Roadmap, since it's about the user rather than a section of the tool). It shows a "Which companies are you targeting?" card listing every non-excluded company (`is_excluded = false`) with a text filter box (mirroring CompanyWise's search, since there are ~50 companies). Added companies sort first.
F3. **Each row has an explicit button, not a star:** an outline "Add" button, which becomes a filled "Added ✓" button once picked; clicking "Added" removes it. Both call `setCompanyPreferred` (the existing action). CompanyWise's star on `/roadmap` stays as it was and is a second surface for the same flag — toggling from either shows up on both, and there's no roadmap-filtering affordance on the profile card.
F4. **Built to be reused as a first-run question.** The card (`PersonalisationCard`) has no dependency on the profile page around it, because the intent is that this becomes one of the questions asked when a user first signs up, in the style of "personalise your feed" onboarding. Sign-up and onboarding don't exist yet and are not built here; with a single implicit user, `/profile` is where it lives for now.
F5. **The ranking signal is exactly what Parts B and D already specify** — a preferred-company match reorders among equally-eligible candidates (same stage in B, same overdue-ness in D) and never changes which stage is reachable or which problem counts as solved. This section doesn't add a third ranking use; it's the input the other two already consume, and both already read `is_preferred` directly, so no change to `lib/nextUp.ts` or `lib/reviewQueue.ts` was needed.
F6. **The dashboard is meant to carry content specific to the companies chosen in the profile.** *First cut built as spec 007's "Your companies" card (per-company roadmap progress and a current-stage next pick); the broader ideas below stay direction only.* Today the only effect is reordering inside Next up and the review queue (F5). The intent is broader — what the dashboard shows should be shaped by the picked companies (for example per-company progress, and the gap between what they ask and what's been solved). That belongs to the company view / gap-analysis work (CLAUDE.local.md Phase 4) and the dashboard's company-progress section; when it is specced, it should read the same `is_preferred` set and keep the "reorders and highlights, never unlocks" rule.

### Scope

In scope: `app/profile/page.tsx`; `app/PersonalisationCard.tsx` (loads companies) and `app/PersonalisationList.tsx` (filter box + Add/Added buttons); a Profile link in `app/AppHeader.tsx`; `/profile` added to `revalidateAll` in `app/actions.ts` so a toggle refreshes it.

Out of scope: sign-up / first-run onboarding flow; company-specific dashboard content (F6); focus tracks, ranking weights, off-roadmap questions from target companies (later phases per CLAUDE.local.md); any other profile content (name, avatar, account settings); company exclusion UI (`is_excluded` stays SQL-only, as spec 005 left it).

### Acceptance criteria

- [x] Clicking Add / Added on the profile card updates `Company.is_preferred` (checked by invoking the same server action the button calls, on the rig database).
- [ ] The change is reflected in CompanyWise on `/roadmap` — both read the same column, but `/roadmap` was not loaded after a toggle.
- [ ] The search box narrows the list by name substring, case-insensitive — the input and filter are written; typing into it was not exercised.
- [x] With a company targeted through the card's action, Part B's pick reorders inside the current stage (Stage 8A: targeting Google changed the second pick from Min Stack to Evaluate Reverse Polish Notation, and unstarring restored it).
- [x] Part D's ordering reorders a preferred-company problem ahead of an equally-overdue one (constructed tie on the rig; see Verification).
- [x] Excluded companies never appear in the card's list.
- [x] The dashboard (`/`) no longer contains the card; `/profile` does, with an "Add" button per company and no star icons.
- [x] "Profile" appears in the header's right-hand group beside the theme toggle, not in the left nav.

### Verification

Checked on 2026-09-24 on an isolated rig (a `pg_dump` copy of the database as a scratch database, an app copy under `.rig-scratch/` on port 3100), all deleted afterwards. The live database was compared before and after: 0 targeted companies, 40 log rows, 40 solved placements, unchanged.

- Rendering was checked by fetching the pages as HTML: `/profile` has the heading and 47 "Add" buttons (one per non-excluded company, matching the database count) and no star icons; `/` no longer has the card; the header markup has the Profile link inside the right-hand group.
- Toggling was done by POSTing to the same server action the button calls, not by clicking. After one add, the card read "1 added", that row's label became "Remove AMD" with an "Added" button, and the live database was untouched.
- Excluded: setting `is_excluded` on one company in the scratch database removed its row; restoring it brought it back.
- Part B: as above.
- Part D: the real data has no rated problems (every solved problem is due as "unrated" with tied overdue days), so I made two solved problems equally overdue in the scratch database, one asked by Google and one not, with the non-Google one slightly older. With no targets the non-Google one was first; with Google targeted the Google one was first.

**Not verified:** nothing was clicked in a real browser (button appearance and states, the filter box, the header layout at narrow widths); CompanyWise reflecting a change made from the profile page; the dark-mode look of the Added button.

## Header note (Part A, amended by Part F)

`AppHeader` (Part A, A3) now also has a "Profile" link on the right, beside the theme toggle; the left nav is still Dashboard and Roadmap.

## Dashboard layout note

Since the company card (spec 007) and the activity calendar (spec 008) were added, `/` has two parts so the cards stay compact and there is room for more: a top row with Next up and the review queue side by side (both short and similar in height, so aligned rows leave no gap; the review queue shows its top 3, and both cards' rows are tighter than first built), then two independent columns below — progress and Your companies on the left, the calendar on the right — so short cards aren't stretched to match tall neighbours. New cards go at the bottom of whichever column is shorter. Checked with a headless screenshot at 1200px wide: the whole dashboard is about 830px tall (it was about 940px), with no gaps inside any card or column.

## Out of scope (whole spec)

`ProblemSet`/`Track`-level analytics, `ItemLink`/convergence highlights, recent-activity feed, pinned resources, event-based reminders (track inactivity, newly added set) — all later phases per CLAUDE.local.md Part 5. Search. Any schema migration (none needed here). A dedicated `/review` page. Mobile-specific layout beyond what already responds via existing Tailwind breakpoints.

## Open items

- **Company-specific dashboard content (F6):** spec 007 covers the first cut (per-company roadmap progress and next pick). Still open: a "what your companies ask that you haven't solved" gap list including off-roadmap questions, which waits on the company view (Phase 4).
- The next-up and review-queue reordering rules (B3, D4) are the first real use of `is_preferred` as a *ranking* signal rather than a display filter; if it turns out to matter which of several preferred companies wins when a problem matches more than one, that's unspecified here (any match counts equally).
- Strengths/weaknesses' "not confidently strong ⇒ weak" rule (E3) is a deliberate simplification or a real design decision, not verified against how it feels once there's more rated data across the roadmap.
- No UI is specified for confirming the minimized card (Part C) reads well once B/D/E/F are sitting next to it and the dashboard actually has competing sections — this is a judgement call to revisit now that E/F exist as sections to actually check it against. (The real click-through owed since spec 005 happened on 2026-09-22 and is recorded there.)
- The review queue and strengths/weaknesses share the notion of "due" (Part D's `isDue`) but nothing here defines what happens once `ReviewLog`-per-stage history (rather than the problem-level roll-up) becomes relevant for a problem with several placements — deferred until it's actually needed.
- **Part D needs a revisit** (see the flag at the top of that section): the Solved/Revised/Revisited redesign was never folded back into this spec's decisions or acceptance criteria, and none of that criteria has been checked against real rated/revisited data — there is none yet.
