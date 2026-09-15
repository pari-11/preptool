# Spec 002 — Baseline Import (Companywise Problems)

Status: Ready for implementation
Depends on: 001 (data model & database setup)
Build step: 2 of 8

## Goal

Take the companywise LeetCode PDF(s) the user provides and load them into the `Company` and `Problem` tables (plus the `ProblemCompany` join), so every company's problem list exists in the database. This is a one-time, manually-run import script — not a live sync, not UI.

## Input

Source: user-supplied PDF export (e.g. "My Leetcode - comparison.pdf"), structured as repeated per-company blocks:

```
<Company Name>
ID  URL  Title  Difficulty  Acceptance %  Frequency %  Done?
<row> <row> <row> ...
```

Observed properties of this data:
- ~90 companies in the first batch, more to be added later in separate PDFs (confirmed out of scope to require all at once).
- The same problem (same LeetCode URL) appears under many different companies — e.g. "Two Sum" appears in Adobe, Amazon, AMD, Apple, etc. These must resolve to **one** `Problem` row linked to multiple companies via `ProblemCompany`, not duplicate rows.
- Some rows have a "Done?" column with a green-filled cell marking problems already solved.
- Not every company block has a "Done?" column (a few, like Flipkart/Gojek/Goldman Sachs, only have ID/URL/Title/Difficulty/Acceptance/Frequency).
- Acceptance % and Frequency % are present for essentially every row — data the current schema (spec 001) does not have fields for.

## Conflicts with the spec 001 schema (must be resolved before coding)

Spec 001 defined `Problem` with:
- `stage_id` as a **required** field (every problem belongs to a Stage).
- No `acceptance_rate` or `frequency` fields.
- `tier` (Core/Supp/Stretch) and `is_priority` as required/flagged fields — these come from the user's own roadmap curation, not from the companywise PDF.

The companywise PDF problems have no Stage, no tier, no priority flag — they're raw company lists, independent of the user's personal roadmap (per PRD 5.1: "This is the user's actual working list — separate from any single company's problem list"). A problem only gets a Stage/tier when the user's own roadmap (Stages 0–20, from the other two source documents) places it there.

This means `stage_id` cannot stay a required field if we import companywise problems that aren't (yet, or ever) part of the personal roadmap — and since spec 001 was revised, "Stage" is a many-to-many `ProblemStage` link rather than a single `stage_id` FK, so more precisely: a companywise-only problem simply has zero `ProblemStage` rows until the roadmap import (spec 003) creates one. Options:

1. **Make `stage_id` optional.** Company-only problems import with `stage_id = null`, `tier = null`, `is_priority = false`, and simply don't appear in the roadmap view (5.1) — only in per-company dashboards (5.4). When/if the user's roadmap later includes that same problem (matched by URL), it gets updated in place with a Stage assignment.
2. **Two-pass import**: import company problems first (with nullable Stage), then separately import the user's own Stage 0–20 roadmap data as a second pass that fills in `stage_id`/`tier`/`is_priority` on matching problems (matched by URL) or creates new roadmap-only problems.

Adopted: option 1 (no `ProblemStage` rows created for companywise-only problems; `tier`/`is_priority` simply don't exist until a `ProblemStage` row is), combined with option 2's two-pass approach for populating roadmap fields later. This requires a small migration to spec 001's schema (Problem↔Stage as many-to-many, per spec 001's revision).

## Decisions (confirmed)

1. **Schema change — approved.** `Problem` no longer has a `stage_id`/`tier`/`is_priority` at all (those moved to the `ProblemStage` join table per spec 001's revision) — a companywise-only problem simply has zero `ProblemStage` rows. `difficulty` stays required since the PDF always provides it.
2. **Acceptance % / Frequency % — store them.** Added as optional `acceptance_rate` / `frequency` fields on `Problem`. Useful signal for how likely a solved/unsolved problem is to show up in a given company's OA.
3. **"Done?" column — apply it.** Where the PDF marks a row done (green cell), the import sets `is_solved = true` on that Problem, saving the user from re-marking problems they've already solved.
4. **Company name cleanup — normalize casing/typos.** Company names get cleaned up on import (e.g. "jpmorgan" → "JPMorgan", "De-shaw" → "DE Shaw") rather than stored as literally typed in the source PDF. Obvious ambiguous cases get flagged during the import run rather than silently guessed.
5. **Store the PDF's "ID" column as `Problem.leetcode_id`.** This is LeetCode's own numeric problem ID, not a row-position number. It's what spec 003 (roadmap import) will use to match a roadmap entry to the companywise problem it already lists, instead of matching on title text — same dedup role the URL already plays for companies, but usable without re-deriving a slug.

## Discussion points (implementation notes, not decisions needed)

- PDF text extraction of a multi-column table is lossy in a few places (a handful of rows have truncated titles/URLs, or acceptance/frequency columns that look misaligned, e.g. some Barclays/Flipkart rows). The importer will treat the LeetCode URL as the source of truth for identifying a problem (title can be re-derived or corrected from the URL slug if the title text looks truncated), and will skip/log any row where the URL itself can't be confidently parsed rather than guessing.
- A few company blocks (Flipkart, Gojek, Goldman Sachs) have no "Done?" column at all — those rows simply default to `is_solved = false`, same as any unmarked row elsewhere.

## Scope

In scope:
- A one-time Node script (`prisma/import-companies.ts` or similar, run manually via `npx tsx` or similar — not committed as a permanent API route) that:
  - Parses the structured company/problem data supplied by the user (see Discussion points for source-format notes).
  - Upserts one `Company` row per company name.
  - Upserts one `Problem` row per unique LeetCode URL (dedup across companies).
  - Creates a `ProblemCompany` row for every (problem, company) pair from the source.
  - Applies "Done?" → `is_solved` per decision 3 above.
- Re-running the script on a new batch of companies (future PDFs) without duplicating existing Problems or Companies — upsert by unique key (URL for Problem, name for Company).

Out of scope:
- Any UI.
- Linking imported problems to the user's Stage 0–20 roadmap (that's a separate, later pass — see Conflicts section, option 2 — likely its own spec once the roadmap data itself is finalized for import).
- Full company list — only the companies present in whatever PDF(s) the user supplies, added incrementally over time.

## Acceptance criteria

- [ ] Spec 001 schema migration applied: `stage_id`/`tier`/`is_priority` removed from `Problem` (now live on `ProblemStage`, populated later by spec 003); `leetcode_id`, `acceptance_rate`, `frequency` added as optional fields on `Problem`.
- [ ] Every company present in the source data has exactly one `Company` row.
- [ ] Every unique problem URL has exactly one `Problem` row, regardless of how many companies list it.
- [ ] Running the import twice on the same input does not create duplicates.
- [ ] Spot-check: "Two Sum" (leetcode.com/problems/two-sum) ends up linked to all companies it appeared under in the source (Adobe, Amazon, AMD, Apple, Bloomberg, Google, Microsoft, etc.).
- [ ] No pages, routes, or roadmap-linking logic added in this step.
