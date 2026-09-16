# Spec 003 — Roadmap Import (Stage 0–22) & Company Linkage

Status: Ready for implementation
Depends on: 001 (data model — Problem↔Stage as many-to-many via ProblemStage, Problem.leetcode_id), 002 (companywise import)
Build step: 3 of 8

## Goal

Import the user's personal DSA roadmap (Stage 0 through Stage 22 — the ordered, curated study path, distinct from the raw per-company LeetCode lists) into the `Stage` and `ProblemStage` tables, and link each roadmap problem to whatever companies already list it (from spec 002's import), matched by LeetCode's own problem ID. This is what makes "I solved problem X — which companies is it relevant to?" answerable.

## Input

Two user-supplied Markdown files, saved in the repo at [data/roadmap-stage-0-7.md](../data/roadmap-stage-0-7.md) and [data/roadmap-stage-8-plus.md](../data/roadmap-stage-8-plus.md):

1. **Stage 0–7** — reference content describing the user's existing roadmap structure (not already built/live anywhere — it's the source of truth for what to build, not a description of an existing system). Format: `## Stage <label> — <title>`, italic `*Insight: ...*` note, list of `- LC <id> — <title>` (some tagged `(premium)`).
2. **Stage 8–22** — first draft, user-authored, importing now as final (no draft/final distinction). Format: `## Stage <label> — <title>`, italic insight note, list of `- LC <id> — <title> — <Tier> [★] [(premium)]`.

Every problem line now carries LeetCode's numeric ID (`LC <id>`) — this is the match key, not the title text.

Some stage labels are non-numeric bridges (e.g. "Bridge B") — these get `is_bridge = true`.

One problem, **LC 268 (Missing Number)**, is intentionally listed under two stages (Stage 2 and Stage 22) — two different solving techniques worth separate reps. This is exactly the case `ProblemStage` (many-to-many, spec 001) exists to handle: one `Problem` row, two `ProblemStage` rows.

## Decisions (confirmed)

1. **Match by `leetcode_id`, not title.** Parse the numeric ID out of each `LC <id> —` prefix. If a `Problem` row with that `leetcode_id` already exists (created by spec 002's companywise import), reuse it — it already has `difficulty`, `acceptance_rate`, `source_link`, and company links. If no `Problem` with that `leetcode_id` exists yet, create a new one (with `difficulty` left unset — see Open items).
2. **Stage.order** — computed from document order across both files concatenated (Stage 0–7 first, then Stage 8–22), not parsed from the label text (labels like "4A"/"Bridge B" aren't sortable as-is).
3. **Stage.stage_label** — stored verbatim from the heading (e.g. "4A", "Bridge B", "9B").
4. **ProblemStage.roadmap_order** — one global sequence across both files, in document order (Stage 0–7 problems first, then Stage 8–22). A problem placed twice (LC 268) gets two `ProblemStage` rows, each with its own position in that sequence.
5. **ProblemStage.tier / is_priority** — only present in the Stage 8+ doc (`— Core ★`, `— Supp`, etc.). Stage 0–7 problems import with `tier = null`, `is_priority = false`.
6. **Premium-flagged problems — persisted.** `Problem.is_premium = true` wherever the roadmap line is tagged `(premium)`, so the frontend can show a badge.
7. **Inline per-problem context — persisted on `Problem.note`.** Parenthetical asides tied to a specific problem (e.g. "*(bridges toward Heap — see Stage 13)*" on LC 23, "*(intentionally also in Stage 2...)*" on LC 268) are stored as that problem's `note`.
8. **The "Notes on choices made in this draft" section (Stage 8+ file) — stored as a `Resource` row**, not discarded as documentation-only. One `Resource` created with `type = Other`, `title = "Roadmap Draft — Notes on Choices (Stage 8+)"`, `note` = the full section text, no `link`/`companies`. This reuses the existing `Resource` model (spec 001) instead of inventing new storage, and makes the draft's rationale something the frontend can actually display (e.g. on a roadmap or resources page) instead of leaving it stranded in a markdown file only visible in the repo.
9. **No title matching, no fuzzy logic needed anymore** — `leetcode_id` is exact and unambiguous, which removes the earlier title-drift risk entirely. The only remaining "no match" case is a roadmap problem whose `leetcode_id` simply hasn't been imported by any companywise PDF yet.

## Scope

In scope:
- A one-time Node script (`prisma/import-roadmap.ts`, run manually, not a committed API route) that:
  - Parses both roadmap Markdown files (stage label, title, insight note, is_bridge; per problem: leetcode_id, title, tier, priority, `(premium)` flag, any parenthetical inline note).
  - Upserts one `Stage` row per stage (by `stage_label`, so re-running doesn't duplicate).
  - For each problem: finds or creates the `Problem` row by `leetcode_id` (setting `is_premium`/`note` on create or update), then upserts the corresponding `ProblemStage` row (by `problem_id` + `stage_id`, so re-running updates rather than duplicates).
  - Upserts the single `Resource` row for the Stage 8+ "Notes on choices" section (by `title`, so re-running doesn't duplicate).
  - Prints a final report: stages created/updated, problems matched-to-existing vs. newly-created, and any problems appearing in more than one stage (expected: LC 268; flagged if any others show up unexpectedly).
- Re-runnable without duplicating Stages, Problems, ProblemStage rows, or the Resource note.

Out of scope:
- Difficulty backfill for roadmap-only problems not yet in any companywise PDF — manual for now.
- Any reordering/editing of Stage 8+ content — imported as given in the current files.
- Progress/dashboard views showing "problem → companies" (later UI step; this spec only makes the data linkage correct so that UI can be built on top of it).

## Acceptance criteria

- [ ] Every stage heading in both files produces exactly one `Stage` row, in correct global `order`, with correct `is_bridge` flag for bridge stages.
- [ ] Every problem line produces exactly one `ProblemStage` row per (problem, stage) pair, with correct `roadmap_order`, `tier`, `is_priority`.
- [ ] LC 268 ends up with exactly two `ProblemStage` rows (Stage 2 and Stage 22), both pointing at the same `Problem` row.
- [ ] A roadmap problem whose `leetcode_id` matches an already-imported companywise problem (e.g. LC 1, Two Sum) reuses that **same `Problem` row** — has both its Stage placement(s) and its company list (Adobe, Amazon, etc.) and correct `difficulty`.
- [ ] Running the import twice does not create duplicate Stages, Problems, or ProblemStage rows.
- [ ] Final run report clearly lists any roadmap problems that did not match an existing companywise `Problem` (new rows, no difficulty, no companies), so the user knows what needs manual reconciliation.
- [ ] Every problem tagged `(premium)` in the source files has `is_premium = true`.
- [ ] Every problem with a parenthetical inline note (bridge callouts, LC 268's cross-stage explanation) has that text in `Problem.note`.
- [ ] Exactly one `Resource` row exists holding the Stage 8+ "Notes on choices made in this draft" section text, and re-running the import doesn't duplicate it.
- [ ] No pages, routes, or dashboard/progress-view logic added in this step.

## Open items (not blocking, tracked for later)

- Difficulty and company links for problems unique to the roadmap (not yet present in any imported companywise PDF) stay empty until either more companywise PDFs are imported, or the user fills them in by hand.
- The companywise PDF data has now been supplied and transcribed to [data/companywise-leetcode-raw.md](../data/companywise-leetcode-raw.md) (~50 companies, ID/URL/Title/Difficulty/Acceptance/Frequency per row). Spec 002 can be implemented against this file. Note: the source PDF's "Done?" (solved) column was not preserved in this transcription — solved status isn't derivable from this file and stays unset until the user marks it directly or re-supplies that column.
