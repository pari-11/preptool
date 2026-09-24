# Spec 007 — Company-Specific Dashboard Content ("Your companies" card)

Status: Built and verified on an isolated rig; not yet clicked through in a real browser.
Depends on: 005 (`Company.is_preferred`, `ProblemCompany`), 006 (dashboard at `/`, Next up's "current stage", the `/profile` picker in part F).
Phase: 2 (analytics core), following up spec 006 F6.

## Goal

The companies a user picks on `/profile` should visibly shape the dashboard, not only reorder Next up and the review queue. This adds a "Your companies" card: for each target company, how much of the roadmap that company asks has been solved, and the next thing worth doing for it.

## Scope

In scope: `lib/companyProgress.ts` (query + pure summary function), `app/TargetCompaniesCard.tsx`, and the card on `app/page.tsx`.

Out of scope: problems a company asks that aren't on the roadmap (gap analysis, Phase 4 in CLAUDE.local.md); ranking by `ProblemCompany.frequency` and the source-window caveat; skills expected; a company detail page; any schema change or migration.

## Decisions

1. **One row per target company** — `Company.is_preferred = true` and `is_excluded = false`, alphabetical. The list is the same one `/profile` edits; there is no second setting.
2. **Progress = distinct roadmap problems the company asks.** "Roadmap problem" means a `Problem` with at least one `ProblemStage` row. A problem in two stages (LC 268) counts once. It's solved if any of its placements is solved, matching the `Problem.is_solved` roll-up.
3. **Next pick = the company's first unsolved problem in the current stage, by `roadmap_order`.** "Current stage" is Next up's definition (first stage in order with any unsolved placement). The candidate pool never leaves it, so this card cannot point ahead of roadmap order — focus reorders and highlights, it never unlocks. If the company asks nothing unsolved in the current stage the row says so instead of reaching into a later stage. If the company has no unsolved roadmap problem at all it shows "All solved"; with none on the roadmap it shows "No roadmap problems".
4. **No targets yet:** the card doesn't disappear. It shows a short prompt with a link to `/profile`, because that's the discoverable path to setting them (and later the first-run question).
5. **Unrated / weak signals are not used here.** This card is about coverage and the next step, not confidence; strengths/weaknesses stays Part E of spec 006.

## Acceptance criteria

- [x] Each target company's `solved/total` matches a hand count from the database (distinct roadmap problems, any-placement solved).
- [x] A problem in more than one stage is counted once in `total`.
- [x] The next pick is unsolved, asked by that company, in the current stage, and the lowest `roadmap_order` among those.
- [x] A company with no unsolved problem in the current stage shows the stage-limited message, not a problem from a later stage.
- [x] With no target companies the card shows the prompt linking to `/profile`.
- [x] Adding or removing a company on `/profile` changes the card on `/` (same flag, revalidated).
- [x] No change to the database or existing ranking code.

## Verification

Checked on 2026-09-24 on an isolated rig (scratch database from `pg_dump`, app copy on port 3100, both deleted afterwards). The live database was compared before and after: 3 targeted companies, 40 log rows, 40 solved placements, unchanged. Pages were fetched as HTML and read as text; toggles were POSTs to the same server action the `/profile` button calls, not clicks.

- **Counts vs hand SQL** (targets Adobe, Apple, Google, already set in the copied data): the card showed Adobe 3/6, Apple 16/38, Google 28/78, and a separate distinct-problem SQL count gave the same three.
- **Dedup:** Google has 79 roadmap placements but 78 distinct problems (LC 268 sits in two stages and Google asks it); the card shows 78.
- **Next pick:** the current stage is 8A. Google's row showed Valid Parentheses, which SQL confirms as its lowest-`roadmap_order` unsolved problem there (position 41). Adobe and Apple ask nothing unsolved in 8A, and their rows showed "Nothing for this company in your current stage" rather than a later-stage problem.
- **All solved / no roadmap problems:** in the scratch copy, marking Arcesium's one roadmap problem solved gave "1/1 · All solved"; DRW, which asks nothing on the roadmap, gave "0/0 · No roadmap problems".
- **Empty state:** with no targets the card shows the prompt linking to `/profile`.
- **Add/remove on `/profile` updates `/`:** each toggle was sent to `/profile` and the next render of `/` reflected it.
- **No ranking or schema change:** the diff touches only `app/page.tsx` (one card added), `app/TargetCompaniesCard.tsx` and `lib/companyProgress.ts`.

**Not verified:** nothing was viewed in a real browser (layout beside Next up, dark mode, narrow widths, the scroll area with many targets); the pure `summariseCompanyProgress` function was only exercised through the running app, not with separate fixtures.

## Open items

- Whether the card should grow into a per-company page (with the off-roadmap gap list) once the company view exists — Phase 4.
- With many targets the card lists all of them in a scroll area; a cap or ordering by most work remaining is a judgement call once real use shows how many companies people add.
