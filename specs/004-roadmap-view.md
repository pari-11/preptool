# Spec 004 — Roadmap View (Frontend)

Status: Ready for implementation
Depends on: 001 (data model), 003 (roadmap data populated)
Build step: 4 of 8

## Goal

The first real page of the app: show the roadmap (Stage 0–22, in order) with each stage's problems, and let the user mark a problem solved or unsolved. This is read-plus-toggle only — no editing of stage/problem structure from the UI (that stays data-file/script driven, per specs 001–003).

## Decisions (confirmed)

1. **Roadmap view first**, not the company view — this is the primary daily-use page. Company view is a separate later spec.
2. **Read + solved toggle only.** No inline editing of tier, priority, notes, stage placement, or company links from this UI. Those remain edited via the markdown data files + import scripts.
3. **Tailwind CSS + shadcn/ui.** Superseded 2026-09-17 — plain CSS (the original decision here) wasn't good enough once the page was actually seen. Tailwind handles utility styling; shadcn/ui provides accessible component primitives (Card, Badge, Checkbox, Tooltip) that get copied into the repo rather than imported as a black box, so they stay easy to adjust. Stage sections become Cards, tier/difficulty become styled Badges, the per-problem note moves from cramped inline text to a Tooltip.
4. **Server Components + a Server Action, no separate API routes.** Since there's no auth/multi-user yet (per the DB hosting note — Docker Postgres for v1, Neon planned for v2), the page queries Prisma directly in a Server Component, and the solved toggle is a single Server Action (`toggleSolved(problemId)`) that flips `Problem.is_solved` and revalidates the page. This avoids building a REST/API layer for a single mutation.
5. **Route: this becomes the homepage** (`app/page.tsx`), replacing the current scaffold placeholder — the roadmap is the app's main purpose, no need for a separate `/roadmap` path yet.

## Scope

In scope:
- `app/page.tsx` (Server Component): queries all `Stage` rows ordered by `order`, each with its `ProblemStage` rows (ordered by `roadmap_order`) including the linked `Problem`.
- Per stage, render: `stage_label`, `title`, `insight_note`, and an `is_bridge` visual distinction (e.g. a different accent/label so bridge stages read as connective tissue, not a numbered stage).
- Per problem row, render:
  - Title, linking to `source_link` if present (opens in new tab).
  - Difficulty badge (Easy/Medium/Hard), or a visible "unknown" state if `difficulty` is null (still possible for any future unmatched roadmap-only problem).
  - Tier badge (Core/Supp/Stretch) when set; nothing when null (Stage 0–7 problems).
  - A priority mark (e.g. ★) when `is_priority` is true.
  - A premium indicator (e.g. 🔒) when `is_premium` is true.
  - The problem's `note`, if present, shown as small inline text or a tooltip (not hidden behind a click — it's short context, not a wall of text).
  - A checkbox reflecting `is_solved`, wired to the `toggleSolved` Server Action.
- `toggleSolved(problemId: string)` Server Action in a new `app/actions.ts` (or colocated): flips `is_solved`, calls `revalidatePath('/')`.
- A minimal top-of-page summary: total problems, total solved (simple count, not a full dashboard — that's a later spec).
- Tailwind CSS installed and configured (`tailwind.config.ts`, `postcss.config.js`, Tailwind directives in `app/globals.css`).
- shadcn/ui initialized, with Card, Badge, Checkbox, and Tooltip components added to `components/ui/`.
- Rework the existing markup: each stage becomes a Card; difficulty/tier/priority/premium become Badge variants; the problem note becomes a Tooltip instead of inline text; the solved toggle uses the shadcn Checkbox instead of a bare `<input>`.

Out of scope:
- Company view (separate later spec).
- Any editing of stage/problem/tier/note/company data from the UI.
- Auth, multi-user, or per-user solved state (single implicit user, per spec 001).
- The `Resource` row (Stage 8+ "Notes on choices") — not surfaced on this page; a later spec can decide where resources are displayed.
- Filtering/search/sorting controls beyond the roadmap's natural stage order.
- Loading states/pagination — the current dataset (39 stages, ~155 placements) is small enough to render in one page load.

## Acceptance criteria

- [x] Visiting the homepage shows all 39 stages in their correct order, each with its problems in `roadmap_order`.
- [x] LC 268 (Missing Number) appears in both its stage placements (Stage 2 and Stage 22) as two separate rows — this is expected, not a bug.
- [x] Bridge stages (e.g. "Bridge B") are visually distinguishable from numbered stages.
- [x] Clicking a problem's solved checkbox persists to the database (verified by reloading the page) and does not require a full page navigation.
- [x] A problem with `difficulty = null` (should be none currently, after the backfill, but the UI must not crash if one exists) renders without erroring.
- [x] Premium-flagged and priority-flagged problems are visually marked.
- [x] No new npm dependencies added beyond Tailwind and the specific shadcn/ui components used (no unrelated state-management/UI libraries).

## Verification (2026-09-20)

Checked against the running app and Docker Postgres:

- 39 stages rendered, in the same order as `Stage.order` in the DB; 155 placements / 154 unique problems.
- LC 268 renders as two rows (Stage 2, Stage 22).
- Only Bridge B (`stage-3`) carries the violet bridge styling.
- 28 ★ on the page = 28 `is_priority` placements in the DB; 6 🔒 on the page = 6 premium placements.
- Solved toggle: called the real `toggleSolved` server action over HTTP, then re-fetched the page. State persisted and the headline count updated. Not clicked in a real browser, so "no full page navigation" rests on the code path (`useTransition` + server action + `revalidatePath`, no redirect).
- Null difficulty: there are 0 such rows in the DB, so the "Unknown" badge path was checked by reading the code, not exercised.
- Dependencies: everything beyond Tailwind comes from the shadcn setup (`@base-ui/react`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `shadcn`, and `cn`, which is shadcn's own package replacing `clsx` + `tailwind-merge`). `Progress` was added by the redesign and is used. `components/ui/button.tsx` is unused.

## Changes since this spec was written

- **Solved state is per placement.** `ProblemStage.is_solved` (migration `add_placement_solved`) drives the checkboxes, so ticking LC 268 in Stage 2 leaves Stage 22 unchecked. `Problem.is_solved` remains as the roll-up ("solved in at least one placement") and feeds the headline count. `toggleSolved` now takes `(problemId, stageId, nextValue)`. This supersedes decision 4's "flips `Problem.is_solved`".

## Open items (not blocking, tracked for later)

- Company view (spec 005+).
- Where/how the `Resource` "Notes on choices" content gets surfaced in the UI.
- Whether a dashboard/progress-by-stage summary is wanted beyond the simple total-solved count here.
