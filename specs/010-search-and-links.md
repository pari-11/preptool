# Spec 010 — Search and Manual Links

Status: Built and verified (search read-only against the live app; `ItemLink` writes on an isolated rig); not yet clicked through in a real browser.
Depends on: 001 (data model). Search reads `Problem`, `Resource`, `Company`; links are a new table.
Phase: 3 (recall and links) — the part of the original vision (CLAUDE.local.md Part 1–2) nothing built so far has touched directly: "where have I seen this before" and the link layer.

## Goal

One search box that finds anything in the tool — a problem, a resource, a company — and a way to say two problems are related in the users' own words, without waiting for embeddings or an LLM (Phase 5).

## Decisions

### Search

S1. **One entry point: the header, nothing else.** No separate `/search` page in the nav — a search icon in `AppHeader`'s right-hand group (before Profile) opens an inline popover with the input and live results, the same interaction pattern `CompanyWise` already uses on `/roadmap`. No API route — a server action, matching the rest of the app (CLAUDE.local.md: "no API layer").
S2. **Searches everything that exists today, in one box: `Problem`, `Resource`, `Company`.** Confirmed with the user directly: they know no second problem source (GFG, a DBMS track) exists yet, but want the code built so that when one does, it's a new registered source, not a rewrite. So results carry an explicit `sourceType` from day one, and `lib/search.ts` merges per-source queries into one typed list rather than one SQL union — adding `ProblemSet` or `Track` later means adding one more source function to that list.
   - **Problem** matches on title, the user's own `user_note` (the vision doc's actual point — "I've seen this insight before" lives in the user's words, not the imported title), and tag names.
   - **Resource** matches on title and topic. Today that's exactly one row (the Stage 8+ notes doc) — the search still has to work correctly for one row as for a hundred.
   - **Company** matches on name — surfaces the company itself (linking to `/companies/[id]`), not every problem it asks (fanning out to a company's 70+ problems on every hit would drown the results).
S3. **No schema change, no migration for search.** With ~800 problems, 47 companies and 1 resource, a case-insensitive substring match (`ILIKE`) across each source is enough. Postgres full-text search (ranking, typo tolerance) is a later upgrade if plain matching feels weak in practice — not built now.
S4. **Each result shows a source label** — "LeetCode" for a `Problem` (accurate: `Problem.leetcode_id`/`source_link` point there), the resource's own `type` for a `Resource` (e.g. "Notes", "OA report"), "Company" for a `Company`. This is what makes the user's own example work once a second source exists: "Abc" as a LeetCode problem and "Abc" as a GFG-set problem (once `ProblemSet` exists) would show as two rows with two labels, not merged — matching "sets stay separate" (CLAUDE.local.md Part 2).
S5. **A `Resource` result has nowhere to land today.** No resource detail page exists (CLAUDE.local.md's own "Not built" list), and the one real resource's `link` field is empty. For v1, a `Resource` result with a `link` opens that external URL; one without is shown but not clickable, title and topic only. This gets better automatically once a resource detail page exists (unrelated future work) — not fixed here.
S6. Results are grouped by source (Problems, then Resources, then Companies), capped per group (e.g. 5) with a "+N more" — not paginated, this is a quick-jump box, not a results page.

### Manual links (`ItemLink`)

L1. **New table, `ItemLink`**: `id`, `from_type`, `from_id`, `to_type`, `to_id`, `link_type`, `label` (nullable), `created_by` (`user` | `system`, default `user`), `created_at`. `from_type`/`to_type`/`from_id`/`to_id` are plain strings, not Prisma relations — CLAUDE.local.md is explicit this table has no FK integrity by design (polymorphic, cleaned up on delete rather than cascaded). Indexed on `(from_type, from_id)` and `(to_type, to_id)` since a link is looked up from either end.
L2. **All five link types from the vision doc, as a Prisma enum**: `SameProblem`, `HarderVariant`, `SameInsight`, `Prerequisite`, `FreeForm`. `SameProblem` and `SameInsight` are symmetric — stored once, shown identically from either problem's page. `HarderVariant` and `Prerequisite` are directional — the same row reads as "harder variant: X" from one side and "easier version: Y" from the other (similarly "requires X first" / "leads to Y").
L3. **v1 is problem-to-problem only** — `from_type`/`to_type` are always `"Problem"` this pass, even though the columns are ready for `"Resource"` or a future `Concept` once those have their own pages to link from. `created_by` is always `"user"` here; `system` (embeddings, LLM) is Phase 5.
L4. **UI lives on `/problems/[id]`**, a new "Links" card: existing links (merged from both directions into one list, direction-aware wording), each linking to the other problem, each with a small delete control (there's only one user, so no ownership check beyond that). An "Add link" row: link-type dropdown, a search box to find the target problem (the `Problem` half of `lib/search.ts`, reused rather than duplicated), an optional label (required for `FreeForm`, since that type has no meaning without one).
L5. **No self-links.** **No duplicate edges**: before inserting a symmetric type, check both directions for an existing row of that type between the same pair and refuse a second one; for a directional type, check only the same direction.

## Scope

In scope: `lib/search.ts` (the three source queries + merge), a header search popover (`app/SearchBox.tsx` or similar) and its server action; the `ItemLink` model + migration, `lib/itemLinks.ts` (create/list-both-directions/delete), the "Links" card on `/problems/[id]` and its server actions.

Out of scope: Postgres full-text search / ranking (S3); a dedicated `/search` results page; linking anything other than two problems (L3); `system`-created links (Phase 5); a resource detail page (S5, unrelated pre-existing gap); convergence highlights (same item across independently-sourced sets — waits on `ProblemSet`, Phase 4).

## Acceptance criteria

- [x] Typing a problem title, a word from a `user_note`, or a tag name in the header search returns that problem, labelled "LeetCode" (or "Problem" if it has no `leetcode_id`), linking to `/problems/[id]`.
- [x] Typing a company name returns the company once, labelled "Company", linking to `/companies/[id]` — not every problem it asks.
- [x] Typing a word from the one existing resource's title or topic returns it, labelled with its resource type.
- [x] Results are grouped by source with a visible label per group.
- [x] Adding a `SameInsight` (or `SameProblem`) link between A and B shows it on both `/problems/A` and `/problems/B`, worded identically.
- [x] Adding a `Prerequisite` link from A to B shows "Leads to" on A's page and "Requires first" on B's page (directional wording, not identical).
- [x] A problem cannot be linked to itself; adding the same symmetric edge twice (either direction) is refused, not duplicated.
- [x] Deleting a link removes it from both problems' pages.
- [x] No schema change beyond the one new `ItemLink` migration; no existing query (Next up, review queue, strengths/weaknesses, company view) is touched.

### Verification

Checked 2026-09-25. The migration (`20260925164744_add_item_links`, two enums + one table, purely additive) was applied directly to the live database — that part is normal schema evolution, not a write-test. Everything that writes *rows* (adding/removing links, and all `ItemLink` correctness checks) was done on an isolated rig (`pg_dump` → scratch database, app copy on port 3100, both deleted afterwards) never the live one.

- **Search, read-only against the live app:** "Two Sum" → 3 problem matches (Two Sum, Two Sum II, Two Sum IV), each labelled "LeetCode". "Google" → exactly the company, not its 78 problems. "Stage 8" → the one real resource, labelled "Notes", `href: null` (no resource page exists — expected, see S5). A 1-character query and a nonsense query both correctly returned nothing. "Tricky" (a tag with no relation to the word in any title) correctly surfaced "Sliding Window Maximum" via the tag-name match.
- **`user_note` matching, on the rig** (no live problem has a note yet): set a synthetic note on "Two Sum" containing "monotonic deque"; searching that exact phrase returned only "Two Sum" — confirms notes are actually searched, not just titles.
- **`ItemLink` writes, on the rig:** added `SameInsight` between Two Sum and Two Sum II — row correct (`from`/`to`/`link_type`/`created_by: User`, label stored as `NULL` not `""`), shown as "Same insight" identically on both pages, each linking to the other. A same-direction repeat and a reverse-direction repeat of the same symmetric edge both left the row count at 1 (deduped, no error). A self-link attempt was rejected with no row written. A `Prerequisite` link from Two Sum to Two Sum IV showed "Leads to" on Two Sum's page and "Requires first" on Two Sum IV's — never both on one page. `FreeForm` with an empty label was rejected; with a label it wrote correctly. Deleting a link removed it from both problems' pages, confirmed for two different links in turn, ending with both pages back at "No links yet" and the table empty.
- **Visual:** a headless-Chrome screenshot of the rig shows the search icon in the header and a populated Links card in the dark theme.

**A mistake made and corrected during this verification:** discovering `runSearch`'s server-action id required brute-force-calling every action on the page with a `["Two Sum"]` argument — this was run against the **live** app (port 3000) on the reasoning that it was "read-only," which was wrong: one of the other actions on that page is `createTag`, and the mismatched call created a real tag row named "Two Sum" on the live database. Caught immediately after by checking the `Tag` table's most recent rows, confirmed it was attached to no problem, and deleted it; a full sweep of `ReviewLog`, solved counts, ratings, `ItemLink` and `user_note` confirmed nothing else was touched. All *subsequent* action-id discovery in this pass (for `addProblemLink`, `removeProblemLink`) was done only on the rig. The lesson (recorded in memory): action-id discovery by brute force is a write probe, not a read, and must happen on the rig even when the intended call looks read-only — an unknown action's *other* candidates aren't read-only just because the one you're looking for is.
- - **Visual redesign (same day, after the user saw it live):** the box widened (22rem → 28rem); each source group got a colour and a small icon badge (Problems: amber, LeetCode-ish; Resources: sky; Companies: violet), both on the group header and per row's trailing label; row titles now wrap onto a second line instead of truncating. Checked with `defaultOpen`/a preset query added only in a rig copy of `SearchBox.tsx` (never the real source) — headless-Chrome screenshots for a problem query, a company query, and a resource query, each in dark and light. Caught and fixed one bug this introduced: the external-link icon was showing next to the one resource with no actual link (`href: null`), which implied it was clickable when it wasn't — now the icon only renders when `href` is present.

**Not verified:** clicked in the user's own browser; the header search's debounce/UX feel; the `AddLinkForm`'s search-and-pick interaction end-to-end through a real click sequence (only the underlying action was exercised directly).

## Open items

- Whether search should also match `Problem.title` transliterations/typos (Postgres FTS or trigram) — deferred per S3 until plain substring search proves insufficient in practice.
- The resource-search dead-end (S5) is a symptom of a real gap (no resource detail page) that this spec doesn't fix — worth revisiting once resources get their own page (Phase 4).
- Whether a canvas/graph view (CLAUDE.local.md Phase 6) should read `ItemLink` directly once it exists — not this spec, just noting the table is being built with that eventual consumer in mind (hence no FK integrity, so it can point at anything).
