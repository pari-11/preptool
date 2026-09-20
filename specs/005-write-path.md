# Spec 005 — Write Path, Stage Groups, Tags, Filters, Roadmap UI and Companies

Status: Built (commits `264268b`, `8f9dc88`, `ca45c41`, `f80a2dd`, and part F in the commit carrying this spec update) and checked against the running app, with the gaps listed under each Verification. Nothing was clicked in a real browser: interactions were checked through the server actions, rendered HTML and screenshots.
Depends on: 001 (data model), 003 (roadmap data), 004 (roadmap view, per-placement solved state)
Phase: 1 of the plan (write path). Phase 2 (dashboard, review queue, strengths/weaknesses) reads what this spec starts recording.

## How this spec grew

It started as the write path (confidence, review history, problem page, bulk entry). At the user's request, and without separate specs, it then took on **stage grouping**, **tags** (including renaming them and changing their colours), **roadmap filters**, a **roadmap UI redesign** (theme, sidebar, dark mode) and a **company layer** (preferred-company chips, the CompanyWise filter, per-company frequency). They are recorded here as parts B–F instead of new spec files. **Bulk entry was built and verified, then removed on 2026-09-20** (the user entered their solved problems by ticking them); the notes below say where. Spec 004's description of the roadmap view (cards, badges, tooltip) is superseded by part E; 004 itself was not edited.

## Part A — Write path

### Goal

Start recording *how well* each problem was solved and *when*, without losing history. Today the app only knows solved / not solved. Confidence, solve dates and a per-solve history are the load-bearing inputs for the review queue, strengths/weaknesses and "what next". Anything solved before this exists is history that can never be recovered, so this ships before any analytics.

Also gives each problem its own page (rate, note, history). A bulk "mark these IDs solved" input was part of the original scope and has since been removed.

### Decisions (confirmed)

1. **Confidence is 1–5, nullable.** (Changed from the 1–3 in the original vision.) A solve can be recorded with no rating. Rating is one click and never required. *Changed 2026-09-20:* there is **no separate "unrated" state on screen**. A solved row always shows the 1–5 control with the current rating highlighted; nothing highlighted means not rated. (The first version showed an "Unrated" chip, but the picker stayed open after a tick, so the chip was never seen.)
2. **Unticking keeps history.** Unticking flips the placement to unsolved but never deletes `ReviewLog` rows, `confidence`, `last_solved_date` or the note.
3. **`ReviewLog` records the stage for problems that sit in more than one stage** (e.g. LC 268 in Stage 2 and Stage 22), so history can say which context each solve belongs to. For a problem in only one stage (or none), `stage_id` is left null; it is not ambiguous.
4. ~~Old progress will be supplied later, through a bulk input.~~ **Removed 2026-09-20:** the bulk input was built, then deleted; the user ticked their solved problems directly, so there is no old-progress list to enter.
5. **Scale anchors** (UI copy only; the database stores the integer):
   1 = couldn't solve it / would fail again · 2 = needed the solution · 3 = got there with a lot of struggle or hints · 4 = solved with some hesitation · 5 = got it cold.
6. **A new solve clears `Problem.confidence`** (back to not rated); the old value is preserved on its `ReviewLog` row. A stale rating from before a re-solve would mislead the review queue, so a fresh solve must be rated fresh.
7. ~~Bulk entry marks the earliest placement only for multi-stage problems.~~ Removed with the bulk input.

### Decisions (proposed defaults — built as written, not explicitly confirmed)

8. **Rating applies to the most recent `ReviewLog` row and to `Problem.confidence`.** Confidence and the note live on the problem, not on the placement or the set membership (per the shared-identity principle).
9. **`ReviewLog.solved_at` stays nullable** ("date unknown", shown as such in the history). Only bulk entry created such rows, so nothing produces them now; `lib/solve.ts` still accepts a null date. How the review queue would treat them is a Phase 2 question if they ever appear.
10. **`is_on_roadmap` is computed** from `ProblemStage`, not stored — a stored flag would drift when the import scripts are re-run. Nothing needs it yet, so there is no code for it.

### Scope

**Schema (migration `add_confidence_and_review_log`)**
- `Problem`: `confidence Int?` (valid values 1–5, enforced in the server actions), `last_solved_date DateTime?`, `user_note String?` (distinct from the imported `note`, which is never used for user input).
- New `ReviewLog`: `id`, `problem_id` (cascade on delete), `stage_id String?` (set null if the stage is deleted), `solved_at DateTime?` (null = date unknown), `confidence_at_time Int?`, `created_at DateTime @default(now())`. Index on `problem_id`.
- Import scripts must not read or write the new fields.

**Server actions** (in `app/actions.ts`; no API routes; shared logic in `lib/solve.ts`)
- `toggleSolved(problemId, stageId | null, nextValue)`:
  - ticking **on**: sets the placement solved, creates a `ReviewLog` row (`solved_at = now`, `confidence_at_time = null`, `stage_id` per decision 3), sets `Problem.last_solved_date = now`, clears `Problem.confidence`, recomputes the `Problem.is_solved` roll-up.
  - ticking **off**: sets the placement unsolved and recomputes the roll-up; touches nothing else.
- `logSolve(problemId, stageId | null)` — re-solve: adds a `ReviewLog` row and updates `last_solved_date` / clears `confidence` exactly as ticking on does, without a toggle. For a problem in several stages the stage is required.
- `setConfidence(problemId, value 1–5 | null)` — validates the range; only allowed while the problem is solved; updates `Problem.confidence` and the latest `ReviewLog.confidence_at_time`. Clicking the current value again clears it.
- `saveNote(problemId, text)` — writes `Problem.user_note`.
- Problems with no roadmap placement (company-data-only) are solved at problem level: `Problem.is_solved` is set directly. For problems with placements, `Problem.is_solved` stays the roll-up "solved in at least one placement".

**Roadmap rows**
- A solved row shows the 1–5 control immediately (also right after ticking, before the server answers), with the current rating highlighted.
- The problem title links to `/problems/[id]`; the LeetCode `source_link` stays reachable (small external-link icon).

**Problem page (`/problems/[id]`, Server Component)**
- Identity: title, difficulty, tier/priority/premium where applicable, link to source, imported `note` (read-only), companies.
- Stages: each placement with its stage label and its solved checkbox (same per-placement behaviour as the roadmap).
- Confidence: the 1–5 control with the anchor labels, and the current rating in the heading once set.
- Last solved date (or "date unknown"); `user_note` editable via `saveNote`; re-solve button (with a stage picker when the problem is in several stages); a Tags card (part C).
- History: `ReviewLog` rows newest first — date (or "date unknown"), stage label if recorded, confidence at the time (or "—").

**Bulk mark-solved (`/bulk-solved`) — removed 2026-09-20.** The page, its form, the `markSolvedByLeetcodeIds` action and the header link were deleted (commit `8f9dc88`). It had accepted LeetCode IDs, marked each solved (earliest stage for multi-stage problems) with a date-unknown log row, skipped already-solved ones and reported unknown ones.

### Out of scope (part A)

- The review queue, next-up, dashboard, strengths/weaknesses, and how 1–5 maps to review intervals (Phase 2; the original 1/2/3 thresholds need re-mapping to five levels then).
- Editing or deleting individual `ReviewLog` rows.
- `ProblemSet`, `Track`, `ItemLink`, search, company view; any `user_id`; any LLM / embeddings.

### Acceptance criteria

- [ ] Migration applies cleanly on the existing database with all existing data intact; the import scripts still run and do not touch the new fields or solved state. *(Partly verified — see Verification.)*
- [x] Ticking a placement creates one `ReviewLog` row, sets `last_solved_date`, and leaves the problem not rated unless a rating is clicked.
- [ ] Every solved row shows the 1–5 control with the current rating highlighted; clicking a value sets `Problem.confidence` and the latest log row's `confidence_at_time`; clicking the current value clears it. *(Server side and the rendered highlight verified; the click itself was not exercised in a browser.)*
- [x] Values outside 1–5 (and rating an unsolved problem) are rejected by `setConfidence`.
- [x] Unticking a placement keeps all `ReviewLog` rows, `last_solved_date`, and the note; the roll-up `Problem.is_solved` is correct afterwards.
- [x] Re-ticking after an untick adds a new log row and clears the current rating (the old rating is still on its earlier row).
- [x] LC 268: ticking in Stage 2 records Stage 2 on its log row and leaves Stage 22 unchecked; ticking Stage 22 later records Stage 22; both rows appear in the history with their stages.
- [x] A problem in a single stage records `stage_id = null` on its log rows.
- [x] `/problems/[id]` shows identity, stages with per-placement checkboxes, rating, last solved, note, re-solve and history; it works for a company-data-only problem (no placements) without erroring.
- [x] Saving a note persists across reload and never writes to `Problem.note`.
- [x] Re-solve from the problem page adds a history row; for LC 268 it requires choosing a stage.
- [x] Bulk entry is removed: `/bulk-solved` returns 404, and the header link and server action are gone. *(It was built and verified first; see the superseded note under Verification.)*
- [ ] Roadmap headline solved count and per-stage counts match the database. *(Headline, the Two Pointers counts and the filtered counts were checked; the other stages' counts were not checked one by one.)*
- [x] No new dependencies beyond shadcn-style primitives built on the existing Base UI package (`package.json` unchanged across parts A–E).

### Verification

Checked 2026-09-20 against the running app (`npm run dev`) and the Docker Postgres. Server actions were called for real over HTTP, and database state was inspected with `psql` after each step. That first round of test data was deleted afterwards. (The database has since been used for real: 39 placements solved, 41 log rows, no ratings. Later write tests ran only against a scratch copy; see parts C–D.)

**Verified**
- Migration `add_confidence_and_review_log` applied; the database held no solved rows, so nothing needed backfilling.
- LC 268 walk-through: tick Stage 2 (one log row, stage recorded, `last_solved_date` set, not rated) → rate 4 (problem and log row both 4) → untick (log row, rating and date kept, roll-up false) → re-tick (new row, rating cleared, old row still 4) → tick Stage 22 (Stage 22 recorded) → re-solve without a stage rejected, with a stage accepted.
- Ratings 7, 0 and 2.5 were rejected, as was rating an unsolved problem.
- LC 141 (one stage) logged `stage_id = null`. LC 6 (no placement) could be solved, rated and unticked at problem level.
- `saveNote`: trimmed text saved, blank saved as null, imported `note` unchanged.
- *Superseded (feature removed):* bulk entry was verified with `268 6 141, 1 999999999 abc 268 12x` (multi-stage marked in Stage 2 only, unknown and invalid IDs reported, a second identical run adding no rows).
- Rendered HTML: `/problems/[id]` for LC 268 (history newest first, stage picker present) and for LC 6 (no placements) returned 200 with the expected content; an unknown id returned 404.
- One defect found and fixed during testing: an undated (bulk) solve left a stale rating behind; any new solve now clears it (decision 6).
- *Superseded:* that round also checked an "Unrated" chip on solved rows. The chip was removed later (decision 1); the current behaviour is checked via screenshots (a highlighted rating where rated, nothing highlighted otherwise) and the rendered pages.

**Not verified**
- Nothing was clicked in a real browser: the rating buttons, the note box and the stage dropdown.
- Import scripts: `import-roadmap.ts` was run (after the grouping change) and left the stage and problem tables unchanged, but nothing was solved or rated at that moment, so this does not prove solved state survives a re-import. That rests on reading the script: its create/update payloads list only imported fields. `import-companies.ts` and `backfill-roadmap-difficulty.ts` were not run.

## Part B — Stage grouping

### Goal

Roadmap stages that are parts of one topic (Stage 4A "Two Pointers — Opposite Direction" and 4B "Two Pointers — Same Direction") read as one thing under a collective title, "Two Pointers", instead of as unrelated cards.

### Decisions (confirmed)

G1. **Only sibling stages are grouped.** A group is every stage sharing a number with a letter suffix (4A, 4B), with at least two members. No broader groupings above these (e.g. "Arrays & Hashing"); the user asked for it not to be too broad. This gives 11 groups covering 26 stages; the other 13 stages (0, 1, 2, Bridge B, 3, 6, 7, 12, 18–22) stay standalone.
G2. **Group title = the first sibling's title before " — ".** So "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked List", "Trees", "Backtracking", "Graphs", "Advanced Graphs", "1-D Dynamic Programming", and "Heap / Priority Queue" (Stage 13A is titled "Heap / Priority Queue — …" and 13B "Heap — …"; the first sibling wins).
G3. **`StageGroup` table + nullable `Stage.group_id`** (set null on delete). A group has a title only: its position on the page follows its stages' own order, so it has no `order` column. `Stage.title` is unchanged (still the full string); inside a group the shared prefix is dropped for display ("4A — Opposite Direction").
G4. **Groups are derived, not hand-listed.** The roadmap import script computes them from the label/title convention. The migration (`add_stage_groups`) also groups the existing stages with a one-time data step (the same rule, written once in SQL), so the script does not have to be re-run.
G5. **A group's counts are the sum of its stages' placement counts**, the same meaning as a stage's own solved/total.
G6. **A group appears where its first stage sits**, and all of its stages are gathered into it even if they were not adjacent.

### Scope

In scope: the migration and its data step; `import-roadmap.ts` deriving groups (and removing empty ones); the roadmap rendering a group as one card (title, combined count and progress bar, sub-stages with shortened titles, own counts, insight notes and problem lists); the sidebar nesting sub-stages under the group title; per-stage rendering in `app/StageSection.tsx`, shared by standalone and grouped stages.

Out of scope: broader groupings; group detail pages; collapsing groups; editing groups in the UI; user-defined grouping (planned with multi-user onboarding); cross-group pattern links such as fast/slow pointers in 4B and 10B (the later pattern view).

### Acceptance criteria

- [x] The migration creates 11 groups covering the 26 sibling stages and leaves the other 13 stages ungrouped.
- [x] `import-roadmap.ts` re-run on the existing database changes nothing; run against a database with the groups cleared, it rebuilds the same 11 groups with the same members.
- [x] The roadmap renders 11 group cards, all 39 stage anchors and all 155 problem rows; sub-stage headings drop the group prefix.
- [x] A group's count is the sum of its stages' counts and updates when a problem is ticked (Two Pointers 1/12, 4A 1/7, 4B 0/5 after ticking one 4A problem, matching the database).
- [x] The sidebar lists each group with its sub-stages nested beneath it (rendered HTML and screenshots).
- [x] Bridge B is still the only violet-tinted card.
- [ ] In a real browser: the sidebar links jump to the right group and sub-stage.

### Verification

Checked 2026-09-20 on the running app and database, by reading rendered HTML, screenshots and database queries. The re-run and from-scratch import ran through a temporary `npx tsx` (not added to the project), after a `pg_dump` backup.

## Part C — Tags

### Goal

Let the user label problems with their own tags ("Revisit", "Tricky", …), with a few pre-added, and filter by them, like a todo list.

### Decisions (confirmed)

T1. **Tags belong to the problem, not to a stage placement**: `Tag` (`id`, `name` unique, `color` key, `is_preset`, `created_at`) and `ProblemTag` (`problem_id`, `tag_id`, cascade both ways), migration `add_tags`. Names are unique case-insensitively (enforced by the action, not the database).
T2. **Five preset tags are seeded by the migration** with fixed ids: Revisit, Tricky, Important, Silly mistake, Neat trick. `is_preset` only affects ordering.
T3. **Any tag can be deleted, including the presets** (the user may want custom tags only). Deleting removes the tag from every problem. There is no "restore defaults"; a deleted preset is re-created by typing its name.
T4. **Custom tags:** names are trimmed and whitespace-collapsed, 1–24 characters; creating a name that already exists (any case) reuses the existing tag. Colours rotate through a fixed order starting at indigo, counting custom tags only.
T5. **Where tags appear:** up to **three** chips on a roadmap row then "+N"; the tag icon is always visible (not hover-only); a Tags card on the problem page shows all of them.
T7. **Tags can be renamed and recoloured** from the Manage tags dialog: a pencil in front of each tag turns its row into a name field with the ten palette colours (amber, rose, violet, sky, emerald, indigo, pink, teal, orange, slate); Save applies both together. Works for every tag, presets included. A new name gets the same cleaning and 24-character limit as a new tag and must not clash with another tag ignoring case; changing only the capitalisation of a tag's own name is allowed. The palette is the fixed set in `lib/tags.ts`; nothing else is accepted.
T8. **Choosing a colour when adding a tag:** the New tag box shows the palette as soon as something is typed, with the next colour in the usual rotation pre-selected, and the chosen colour is saved with the tag. Reusing an existing tag's name keeps that tag's colour. The row popover's New tag box does the same.
T6. **One "Manage tags" dialog** (add, change colour, and delete with an inline "Delete X? Removed from N problems. [Delete] [Cancel]") is opened from the filter popover's "+ New tag" chip and from a "Manage tags" link in each row's tag popover. The dialog lives in a shared provider outside every popover, because a dialog inside a popover counts as an outside click and closes both.

### Scope

In scope: schema and migration; actions `createTag(name, problemId | null, color?)` (returns the tag), `setProblemTag(problemId, tagId, on)` (idempotent), `updateTag(tagId, name, color)` (rename and/or recolour, returns the tag or an error message), `deleteTag`; `TagsProvider` (all tags with usage counts, passed once from the server, plus the dialog); the row tag popover (toggle tags, create-and-apply); the Manage tags dialog; the problem-page Tags card; `components/ui/popover.tsx` and `components/ui/dialog.tsx` on Base UI.

Out of scope: tag search; tags on stages or companies; using tags as `ItemLink` sources (the later link layer treats tags as scaffolding).

### Acceptance criteria

- [x] The migration creates `Tag` and `ProblemTag` and seeds the five preset tags.
- [x] `setProblemTag` on/off works and repeating a call changes nothing.
- [x] `createTag` trims and collapses whitespace, rejects empty and over-24-character names, reuses an existing name regardless of case, returns the tag, and rotates colours for custom tags.
- [x] `createTag` with a colour saves that colour; a bad colour is rejected and creates nothing; without a colour it still rotates; reusing an existing name (any case) keeps the existing tag and its colour.
- [x] `updateTag` renames and/or recolours a custom tag and a preset (whitespace cleaned), allows a capitalisation-only change, and rejects a name that clashes with another tag (custom or preset, any case), an empty or over-24-character name, an unknown colour (including `__proto__`) and a missing tag, each leaving the tag unchanged. A renamed tag shows its new name on row chips and filter pills.
- [x] The Manage tags dialog has a pencil in front of each tag; clicking it shows a name field, Save/Cancel and the palette with the current colour ticked, and the New tag box shows the palette (suggested colour selected) as soon as text is typed (screenshots with those states forced open, light and dark).
- [x] `deleteTag` removes any tag, including an in-use preset, leaves no orphan links, and is harmless for an id that no longer exists.
- [x] A roadmap row shows three chips and "+1" for a four-tag problem; the tag icon carries no hover-only styling.
- [x] The Manage tags dialog lists every tag with its colour and usage count, shows the delete confirmation inline, and renders in light and dark (screenshots with the dialog forced open).
- [x] A saved link containing a deleted tag id falls back to the unfiltered roadmap.
- [ ] In a real browser: opening the dialog from the filter popover and from a row (and the popover closing behind it), adding a tag with a chosen colour, editing a tag's name and colour (Save, Cancel, a duplicate-name error), deleting with confirm and cancel, toggling a tag on a row, the problem-page Tags card.

### Verification

Checked 2026-09-20. **Writes were tested only against a scratch copy** (a `pg_dump` of the live database loaded into a scratch database, with a copy of the app on port 3100 pointed at it; both removed afterwards). Isolation was confirmed with one write that changed the scratch database and not the live one. The live database was only read; its tag and log counts were unchanged (41 log rows, 5 tags, no ratings). Interactive states were captured by forcing popovers/dialog open in the scratch copy only.

**Not verified:** every click in the criterion above; the problem-page Tags card beyond the page returning 200.

## Part D — Filters

### Goal

Narrow the roadmap by solved/unsolved, difficulty, 1–5 rating and tag, without a heavy shop-style filter UI.

### Decisions (confirmed)

F1. **One quiet line:** a "Filter by" button (with a count of active filters). It opens a small popover with the options; nothing else is shown until then, apart from "Showing N problems in M stages · Clear" while a filter is on.
F2. **State lives in the URL** (`?status=unsolved&difficulty=Easy&rating=4&rating=5&tag=<id>`) and the server filters. Options are links, so the popover stays open for the next pick and filtered views can be bookmarked.
F3. **AND across filters, OR within one:** Easy or Hard, and rating 4 or 5, and tag Tricky or Revisit.
F4. **Status and rating look at the placement** (the row's checkbox). A problem solved in Stage 2 but not Stage 22 counts as solved only in the Stage 2 row. A rating exists only on a solved row, so filtering by rating implies solved. A problem with no difficulty never matches a difficulty filter.
F5. **Counters keep whole-stage totals** under a filter (a stage still says 3/8, not 0/5), and stages with no matching rows drop out of the page and the sidebar. The stat tiles at the top are always overall.
F6. **Unknown values are ignored** (bad status, difficulty, rating; tag ids that no longer exist).

### Scope

In scope: `lib/roadmapFilters.ts` (parse, href, match), the `RoadmapFiltersPanel` popover, server-side filtering in `app/page.tsx`, the empty state.

Out of scope: saved filters; text search; sorting.

### Acceptance criteria

- [x] Each filter and combination returns exactly the rows the equivalent database query does: status, difficulty (single, multiple, combined with status), rating (single, multiple, with difficulty), tag (single, multiple, with status and rating) and all four together — 12 checks on the live database (status/difficulty; rating/tag returned 0 = 0 there) and 9 more on the scratch copy with ratings and tags present.
- [x] Junk parameters are ignored and the full roadmap is shown.
- [x] The summary line and the "No problems match these filters" state render.
- [x] The popover renders in light and dark with the active options highlighted (screenshots with it forced open).
- [ ] Stage counters keep whole-stage totals under a filter. *(Implemented; not explicitly checked.)*
- [ ] In a real browser: the popover opens, stays open between picks, closes on Escape/outside click, and "Clear" works.

### Verification

Row counts were compared with `psql` queries on the live database (read-only) and on the scratch copy (with seeded ratings and tags). Screenshots via headless Chrome with an isolated profile.

## Part E — Roadmap UI

### Goal

Make the roadmap look like a finished product: consistent theme, clear hierarchy, dense aligned rows, and room for tags.

### Decisions (confirmed)

U1. **Theme:** indigo accent on cool neutrals via the existing CSS tokens; **Inter** through `next/font` (no new package); a shared sticky header (PrepTool, Roadmap, theme toggle) in the root layout.
U2. **Roadmap page:** four stat tiles (Solved, Easy, Medium, Hard) above the filter line; stage and group cards; problem rows with fixed-width difficulty and tier columns, then the rating control on the right; solved rows are dimmed rather than struck through.
U3. **Rows leave room for tags:** the difficulty and tier columns are narrow (4.5rem / 4.25rem) and the rating slot 8.75rem; the roadmap column is `max-w-5xl` (`6xl` when the sidebar is collapsed).
U4. **Collapsible stage sidebar with a visible toggle (not a menu):** it folds to a slim rail and the roadmap takes the width. The choice is kept in a **cookie** (`roadmap-nav`) so the server renders the right layout, with no flash. The sidebar follows the scroll position, highlighting the current stage, and is hidden below the `lg` breakpoint.
U5. **Dark mode:** class-based (`.dark` on `<html>`). A tiny script in `<head>` applies the saved choice (localStorage, guarded) or else the system setting before first paint. A sun/moon button toggles it. Chip colours have dark variants; `color-scheme` follows the theme so native scrollbars match.
U6. Colour-coded chips: difficulty, tier, tags, and stage labels (Bridge B keeps its violet tint).

### Scope

In scope: `app/globals.css` tokens, `app/layout.tsx`, `AppHeader`, `ThemeToggle`, `RoadmapShell`, `RoadmapNav`, `StageSection`, `PlacementRow`, `ProgressBar`, and consistent styling of the problem page.

Out of scope: a dashboard (Phase 2); a mobile navigation for the stage list; user-selectable accent colours.

### Acceptance criteria

- [x] The roadmap and problem page use the new theme and header, in light and dark (screenshots). (The bulk page was restyled too, then removed.)
- [x] The layout fits a 390px phone viewport (header nav on one line, stage progress bar hidden on phones); checked before tags and filters were added, not re-checked since.
- [x] With the `roadmap-nav=collapsed` cookie the server renders the collapsed rail (narrow sidebar, "Expand" toggle, no stage list); without it, the full sidebar with a "Collapse" toggle.
- [x] The theme follows the system setting when nothing is saved (a dark system rendered dark on first load).
- [x] Difficulty and tier columns sit further right and the title cell has room for three tag chips.
- [ ] In a real browser: the sidebar toggle folds and unfolds and the choice survives a reload; the theme toggle flips and the choice survives a reload; the highlighted stage follows scrolling; sidebar links jump to the right stage.

### Verification

Screenshots (headless Chrome and Edge, light and dark, desktop and a 390px iframe) of the live app and the scratch copy, plus rendered-HTML checks with and without the sidebar cookie. **Not verified:** all clicks and scrolling (see the unticked criterion).

## Part F — Companies on the roadmap

### Goal

Answer "which of the companies I'm targeting ask this problem?" while reading the roadmap, and let the roadmap be narrowed to one company's problems. This is the first piece of the personalisation idea in CLAUDE.local.md Part 1: the display and filtering half, which needs no inference. It also fixes `Problem.frequency`, which held the wrong thing.

### Decisions (confirmed)

C1. **Only starred (preferred) companies appear under a problem.** Every roadmap problem is asked by a dozen-odd companies; listing them all would drown the row. `Company.is_preferred` already existed and is what the chips read. With nothing starred the row shows nothing at all.
C2. **A separate "CompanyWise" button, not a section inside "Filter by".** Picking one company to study is a different action from narrowing a list, so it gets its own control next to the filter button. It is still an ordinary filter underneath, AND-ed with the others.
C3. **Starring and filtering live in the same panel.** Both answer "which companies do I care about", and splitting them across two screens would mean setting the same list twice. Clicking a company filters; the star beside it marks it preferred.
C4. **The chips are a native `<details>`**, collapsed to a chevron, a stack of up to four logos and "N companies". No JavaScript, so the roadmap row stays a Server Component.
C5. **`frequency` moves to `ProblemCompany`** (migration `add_company_frequency_and_index`, plus an index on `company_id`). The source states an ask-rate per (company, problem); `Problem.frequency` has one row per problem and so held whichever company the import read first — Adobe's 75% on Two Sum. The import now writes `Problem.frequency = null`. Nothing read it, so nothing broke.
C6. **Company slugs, not ids, in the URL** (`?company=goldman-sachs`), so a filtered link stays readable. Unknown slugs are ignored, like unknown tag ids (F6).
C7. **Logos are files under `public/companies/<slug>.<ext>`**, resolved on the server. A company with no file falls back to its initials on a colour derived from its name. The directory is read once per server process. Formats rank `svg > png > webp > jpg > jpeg > ico`, so a better file can be dropped in later without deleting the old one.
C8. **Excluded companies are left out** of the panel entirely (`Company.is_excluded`, already in the schema, currently false everywhere).

### Scope

In scope: migration `add_company_frequency_and_index`; `import-companies.ts` carrying frequency per company and nulling `Problem.frequency`; `lib/companies.ts` (slug, initials, tint — pure, importable from client code); `lib/companyLogos.ts` (`server-only`, filesystem lookup); `app/CompanyLogo.tsx` and the client twin inside `CompanyWise`; `app/ProblemCompanies.tsx` (the `<details>` chips); `app/CompanyWise.tsx` (search, star, filter, counts); `company` added to `lib/roadmapFilters.ts`; per-company roadmap counts in `app/page.tsx`; `setCompanyPreferred` in `app/actions.ts`; 44 logo files and `public/companies/README.md`.

Out of scope: the company detail view and off-roadmap gap analysis (Phase 4); using frequency to rank or sort anything (the chips are alphabetical); showing companies on `/problems/[id]` beyond what part A already renders; the source-window field discussed in CLAUDE.local.md (needs data the raw files do not carry); a UI for `is_excluded`; pulling in off-roadmap company questions (Phase 5).

### Acceptance criteria

- [x] Migration applies with existing data intact: 40 solved placements and 43 `ReviewLog` rows unchanged afterwards (`pg_dump` taken first).
- [x] After re-running `import-companies.ts`, `ProblemCompany.frequency` is set on 1738 of 1739 rows (the one null is IMC's truncated Trapping Rain Water row the parser already documented) and `Problem.frequency` is non-null on 0 rows.
- [x] The company filter returns what the database does: 154 problems unfiltered, 103 for Amazon (matching the `psql` count exactly), 6 for Adobe.
- [x] With companies starred, each matching row renders a `<details>` listing exactly the starred companies that ask it and no others (6 rows for Adobe, 3 of them also Google).
- [x] A company with no logo file renders its initials (AD, GO) instead of a broken image.
- [x] Logo files are served with the right content type: `.svg` → `image/svg+xml`, `.png` → `image/png`, `.ico` → `image/x-icon`, all 200.
- [x] An unknown company slug in the URL is ignored and the full roadmap is shown.
- [x] `npx tsc --noEmit` is clean; `lib/companies.ts` stays free of Node imports so the client bundle does not pull in `fs`.
- [ ] `setCompanyPreferred` is exercised through the action rather than SQL. *(Not done — see Verification.)*
- [ ] In a real browser: the CompanyWise popover opens, the search box filters the list, the star toggles and persists, and the `>` expands.
- [ ] The logo images are visually correct (right brand, legible at 14px). *(Fetched and served, never looked at.)*

### Verification

Checked 2026-09-20 on the running app and the live Docker database, after a `pg_dump` into the session scratchpad. The migration and the import re-run were run against the live database (both additive: the import only upserts and never deletes, and its `Problem` update payload touches `acceptance_rate` and `frequency` only). Solved and rating state was counted before and after and was unchanged.

Counts came from `psql` and from counting distinct `/problems/<id>` links in the rendered HTML. To see the chips at all, Adobe, Google, Microsoft and Amazon were starred **with a direct SQL update**, the rendered page was checked, and every company was then set back to `is_preferred = false` — the state this part was found in, and the state it is being committed in.

**Not verified**
- `setCompanyPreferred` itself. The star was set in SQL, so the action's own path (and `revalidatePath` refreshing the chips) has not run once. It is four lines and mirrors `deleteTag`, but it is untested.
- Every click listed in the unticked criterion above, consistent with the rest of this spec.
- The logo images themselves were never viewed. 24 came from Simple Icons (CC0, recoloured to each brand's hex), 20 from public favicon endpoints (DuckDuckGo, Google as fallback); files with identical byte lengths were hash-checked to rule out a shared placeholder icon, but nothing confirms each image is the brand it claims. BlackRock, Citadel and Millenium have no file and fall back to initials.
- Whether `imc.ico` (306 KB) is worth keeping at chip size; it only loads if IMC is starred.

## Open items

- **Decisions 8–10** were built as proposed and not explicitly confirmed; decision 10 has no code yet.
- **Group title for Heap** is "Heap / Priority Queue" because of how the source titles are written; renaming it is a one-row change if "Heap" is preferred. Groups come only from the stage-number convention.
- **Mistaken ticks leave a history row** because history is kept on untick. Deleting a single log entry is deferred.
- If a single-stage problem later gains a second stage through a re-import, its older log rows keep `stage_id = null`.
- **Review queue:** the 1–5 interval mapping is a Phase 2 decision, as is how `solved_at = null` rows would be treated (none exist now that bulk entry is gone). The "unrated" concept is no longer shown, but a solved problem with no rating still exists in the data and Phase 2 must decide how it is queued.
- **Tags:** no search or "restore defaults"; if the tag list grows large the row popover will need search.
- **Filters:** tag counts in the filter count problems, not placements; the rating filter matches only solved placements.
- **Dark mode** follows the system on a first visit; an explicit choice is stored per browser (localStorage), not per user.
- **Sidebar** is hidden below `lg`; there is no mobile stage navigation.
- **Companies:** nothing is starred, so the chips are invisible until the user stars something — the feature looks absent on first load. `ProblemCompany.frequency` is now correct but unused; ordering the chips by it is the obvious next use. Three companies have no logo, and the 20 favicon-sourced files are lower quality than the 24 vector ones. The per-company **source window** (some of `prisma/data/raw/` is the 6+ month bucket by deliberate choice) is still recorded nowhere, which will matter for Phase 4 gap analysis.
- **Row alignment:** `PlacementRow` still centres its columns vertically, so on a row with company chips the checkbox and badges sit against a two-line block. Not looked at in a browser.
- **Browser check:** every interactive behaviour above still needs one real click-through.
