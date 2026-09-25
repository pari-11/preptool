# Spec 009 — Company View (roadmap coverage + off-roadmap gap list)

Status: Built and verified (Part A on an isolated rig, Part B read-only against the live app); not yet clicked through in a real browser.
Depends on: 001 (data model), 003/004 (roadmap, `ProblemStage`), 005 part F (`Company.is_preferred`, `ProblemCompany.frequency`), 007 (the "Your companies" card this extends), 008 part C6 (the calendar's company-list source, which this finally lets the user populate).
Phase: 4 (breadth), pulled forward — it finishes spec 007's "still to come" and spec 006 F6's off-roadmap direction, and it's the reason the calendar's violet source has no real data yet.

## Goal

One page per company: what of its roadmap footprint is solved, what isn't, and — the part that doesn't exist anywhere yet — what it asks *outside* the roadmap, as a gap list the user can act on directly.

## Decisions

1. **Route: `/companies/[id]`.** By id, not the derived slug (`companySlug` has no stored, guaranteed-unique column; the roadmap's `CompanyWise` filter can keep using the slug for its own URL, this is a separate concern). `is_excluded` companies are not linked to from anywhere new this spec adds, but the route itself doesn't block on it — no new gate, matching spec 005's decision to keep `is_excluded` SQL-only.
2. **Three sections**, all scoped to one company:
   - **Header:** logo, name, an Add/Added button (reuses `setCompanyPreferred`, the same action `/profile` uses — a third surface for one flag, not a new one), and two counts: roadmap solved/total, off-roadmap solved/total.
   - **Roadmap coverage**, one row per `ProblemStage` placement this company's `ProblemCompany` rows touch (not per problem — matches the grain everything else on the roadmap uses, and sidesteps which stage a multi-stage problem's inline checkbox would apply to). Sorted by stage order, then `roadmap_order`. Each row: title, difficulty, stage badge, an inline `SolvedCheckbox` (already generic — `app/problems/[id]/page.tsx:126` proves it works keyed to one placement), link to `/problems/[id]`.
   - **Off-roadmap gap list** — this company's problems with **no** `ProblemStage` row at all. This is the gap analysis named in CLAUDE.local.md Part 3 and never built. Sorted by `ProblemCompany.frequency` descending (nulls last), then title. Each row: title, difficulty, frequency number (the spec 005 part F decision to surface the number rather than a bare logo applies here too), an inline `SolvedCheckbox` with `stageId: null`. **This already works end-to-end with no backend change**: `recordSolve`/`clearSolved`/`recomputeRollup` in `lib/solve.ts` already handle a problem with zero placements (solve at problem level, roll-up untouched since there's nothing to recompute) — `/problems/[id]` already exercises this path for a company-only problem reached directly by URL. This view is the first place that *lists* such problems, so it's the first place a user can find and solve one, which is also what finally lets a real event land in the calendar's `company-list` source (spec 008 C6's "catch").
3. **Confidence and notes are not duplicated into row UI.** A solved row's rating happens on `/problems/[id]`, same as every other solved-but-off-the-roadmap-page problem today; this view links there rather than inlining `ConfidencePicker` a second place.
4. **Entry points added:** the company name in the dashboard's "Your companies" card (spec 007) and in the `/profile` picker (spec 006 F) both become links to `/companies/[id]`. The roadmap page's per-row company chips and the `CompanyWise` popover are **not** changed — the popover's click already means "filter the roadmap by this company," and overloading it with a second meaning (navigate away) is a worse interaction, not a shortcut.
5. **Out of scope, named so it isn't silently dropped:** `Company.skills_expected` (field doesn't exist yet, no source data identified — CLAUDE.local.md lists it as still-planned, not decided); the frequency source-window caveat (spec 005 part F left this deferred, still true here); excluding a company from this page; any change to `ProblemCompany.frequency`'s meaning; a "readiness hint" for off-roadmap items (Phase 4's own next item, not this one).

## Scope

In scope: `app/companies/[id]/page.tsx`; `lib/companyDetail.ts` (the two-section query, kept separate from `lib/companyProgress.ts` since that one is scoped to *target* companies and the dashboard's current-stage pick — different question, different function, not reused); linking the company name in `app/TargetCompaniesCard.tsx` and `app/PersonalisationList.tsx`.

Out of scope: everything in Decision 5; a dedicated "gap analysis" summary across *all* companies (this is per-company only); changing `SolvedCheckbox` or `lib/solve.ts` (neither needs to change — that's the point).

## Acceptance criteria

- [x] Roadmap-coverage rows match a hand count from the database for a company with several placements, split solved/unsolved.
- [x] A problem in two roadmap stages for the same company shows as two rows (one per placement), each with its own checkbox and stage badge, and ticking one doesn't tick the other (existing `ProblemStage`-level behaviour, just exercised from a new page).
- [x] Off-roadmap rows are exactly the company's problems with zero `ProblemStage` rows, ordered by frequency descending then title.
- [x] Ticking an off-roadmap row's checkbox marks it solved (`Problem.is_solved`, a `ReviewLog` row, no `ProblemStage` touched), matching what `/problems/[id]` already does for the same case.
- [x] The header's two counts match the two sections' own solved/total.
- [x] The Add/Added button here changes `Company.is_preferred` — verified by the button's own rendered state (Added, filled) matching the database; not separately re-clicked from `/profile` or the dashboard card this pass (spec 006/007 already verified that flag is shared).
- [x] Company name links from the dashboard card and `/profile` land on the right `/companies/[id]`.
- [ ] A company with zero roadmap placements or zero off-roadmap problems renders without an empty-section error — the empty-state copy exists in the code but wasn't exercised against a real company with either count at zero this pass.

### Verification

Checked 2026-09-25 on an isolated rig (`pg_dump` → scratch database, app copy on port 3100, both deleted afterwards). The live database was compared before and after: 40 log rows, 40 solved placements, 4 targeted companies, unchanged.

- **Coverage vs SQL:** Google (`cmu2bywd60010zdzji3ij9392`) rendered 79 placement rows, 28 checked; a separate SQL count of `ProblemStage` joined to `ProblemCompany` for that company gave the same 79 total and 28 solved.
- **Off-roadmap vs SQL:** 123 rows rendered, matching a SQL count of Google's `ProblemCompany` rows with no `ProblemStage`; "Off-roadmap: 0/123 solved" in the header before any tick.
- **Multi-stage placement (LC 268 / Missing Number, Google's example in both Stage 2 and Bridge B):** rendered as two separate rows on the company page, each linking to `/problems/[id]`; the raw HTML showed one row's hidden checkbox input as `checked=""` and the other's without it — independent per placement, as `ProblemStage.is_solved` requires.
- **The off-roadmap solve flow (the point of this spec):** ticked an unsolved off-roadmap Google problem via the page's own action. Afterwards: `Problem.is_solved = true`, exactly one new `ReviewLog` row, zero `ProblemStage` rows for that problem (there were none to begin with) — the same path `/problems/[id]` already exercises for a company-only problem, now reachable by browsing rather than only by a direct URL. The header updated to "Off-roadmap: 1/123 solved" and the total checked-input count on the page went from 28 to 29 (28 roadmap + 1 off-roadmap).
- **Entry points:** `/profile` and `/` (the dashboard's "Your companies" card) both render `href="/companies/<id>"` for each company/target, with the correct id.
- **Visual:** a headless-Chrome screenshot of the Google page in dark theme shows the header, counts, Add/Added button and the coverage list with stage and difficulty badges reading correctly.

**Not verified:** clicked in the user's own browser; the empty-state copy for a company at either extreme (all-roadmap or all-off-roadmap); light theme; narrow widths; whether ticking from `/profile` or the dashboard card (rather than this new page) still reaches `/companies/[id]` correctly on the very same request (the shared `revalidatePath` was added but not independently re-exercised).

## Part B — Companies get their own top-level section (revised 2026-09-25)

The company page originally shipped reachable only from `/profile` (its back-link read "← Profile"). The user said this made it read as part of the profile flow rather than its own thing, and asked for a top-level nav entry plus a directory page, with `/profile` narrowed back to only the targeting list.

### Decisions

B1. **New route `/companies`** — a directory of every non-excluded company (the same set `/profile` lists), alphabetical, with a search box (same pattern as `/profile`'s). Each row: logo, name, roadmap solved/total (or "No roadmap problems" when the company asks none — matching spec 007's wording), and the same chevron-link treatment as everywhere else a company name appears.
B2. **No Add/Added button on `/companies`.** Targeting stays exclusively `/profile`'s job, per the user's own framing ("profile only keeps a list of companies re[garding targeting]"). The directory is a browse surface, not a second place to manage the flag.
B3. **`AppHeader` gets a third top-level nav item, "Companies"**, between Roadmap and the header's right-hand group (Profile, theme toggle) — it's a section of the app like Dashboard/Roadmap, not a personal-settings link like Profile. Active on `/companies` and `/companies/*`.
B4. **The company detail page's back-link now points at `/companies`** ("← Companies"), not `/profile`. Existing entry points (the dashboard's "Your companies" card, `/profile`'s list) are unchanged — clicking a name still goes straight to `/companies/[id]`, per the user's "top-level nav along with clicking a name wherever it's listed."

### Scope

In scope: `app/companies/page.tsx`, `app/CompanyDirectoryList.tsx` (client: search + rows), `lib/companyDirectory.ts` (the query); `app/AppHeader.tsx` (new nav item); the back-link change in `app/companies/[id]/page.tsx`.

Out of scope: any Add/target control on `/companies` (B2); changing what `/profile` shows beyond nothing (it was already just the targeting list).

### Acceptance criteria

- [x] `/companies` lists every non-excluded company, alphabetical, matching a count from the database.
- [x] Each row's solved/total matches the same numbers a hand SQL count gives (dedup by problem, as spec 007 does).
- [x] The search box exists with the same filter behaviour as `/profile`'s (same component pattern); not separately exercised by typing this pass.
- [x] No Add/Added control appears anywhere on `/companies`.
- [x] The header shows "Companies" as a third nav item, highlighted on `/companies` and on a company detail page.
- [x] The company detail page's back-link goes to `/companies` and reads "Companies".
- [x] Clicking a company name from the dashboard card and from `/profile` still lands on `/companies/[id]` directly (unchanged).

### Verification

Checked 2026-09-25 read-only against the user's own already-running dev server (no rig — this adds a read page and a nav item, no new writes to verify in isolation). Live database compared before and after: 40 log rows, 40 solved placements, 4 targeted companies, unchanged.

- **Directory count and order:** 47 rows, matching `is_excluded = false`. A bug surfaced and was fixed here: Prisma's `orderBy: { name: 'asc' }` sorts by the database's raw collation, which put "AMD" before "Adobe" — visibly wrong alphabetical order, and inconsistent with `/profile` and `CompanyWise`, both of which re-sort with `localeCompare`. Added the same `localeCompare` pass to `lib/companyDirectory.ts`; the rendered order is now Adobe, Affirm, Amazon, AMD, Amex, Apple, matching what the equivalent list on `/profile` shows.
- **Counts vs SQL:** Google's row read "28/78 solved"; a distinct-problem SQL count (dedup by problem, matching spec 007's rule) gave the same 78 total and 28 solved.
- **No Add button:** confirmed absent from the rendered page.
- **Nav:** the header's "Companies" item is highlighted (`aria-current="page"`, `bg-accent`) on both `/companies` and `/companies/[id]`.
- **Back-link:** the page-body back-link (separate from the header nav, which also happens to read "Companies") points at `/companies`.
- **Visual:** headless-Chrome screenshots of the directory and a detail page in dark theme show the search box, rows with logos/counts/chevrons, and the nav/back-link state.

**Not verified:** clicked in the user's own browser; typing into the search box; light theme; the empty-search-result state; narrow widths.

## Open items

- Whether solving a genuinely new off-roadmap problem here should also suggest "readiness" (which roadmap stage's pattern it resembles) — that's Phase 4's next line in CLAUDE.local.md, explicitly not this spec.
- Whether the roadmap page's company chips should eventually link here too, now that there's somewhere to link to — not decided; the popover's existing click meaning stays as is until asked.
