# Spec 001 — Data Model & Database Setup

Status: Draft
Depends on: none
Build step: 1 of 8

## Goal

Stand up the database schema that every later feature reads and writes. No UI, no seed data, no API routes in this step — just the schema, the migration, and a working local Postgres connection.

## Scope

In scope:
- Prisma schema definition for all v1 entities.
- Join tables for many-to-many relations.
- Local Postgres connection (via `DATABASE_URL` in `.env`).
- Initial migration, applied and verified.
- Prisma Client generated and importable.

Out of scope (later steps):
- Seed/import scripts (Step 2).
- Any page, component, or API route.
- Auth, multi-user fields — single implicit user, so no `User` model in v1.

## Entities

### Company
| field | type | notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | unique |
| is_preferred | Boolean | default false |
| is_excluded | Boolean | default false |

### Stage
| field | type | notes |
|---|---|---|
| id | String (cuid) | PK |
| stage_label | String | e.g. "0", "4A", "B" |
| title | String | |
| insight_note | String | long text |
| order | Int | global sequence position |
| is_bridge | Boolean | default false |

### Problem
| field | type | notes |
|---|---|---|
| id | String (cuid) | PK |
| title | String | |
| leetcode_id | Int? | unique, LeetCode's own numeric problem ID — the stable cross-source match key (see spec 002/003) |
| stages | Stage[] | many-to-many, via join table ProblemStage — a problem can appear in more than one stage when it's worth a rep via a different technique (e.g. LC 268 Missing Number). Per-placement fields (roadmap_order, tier, is_priority) live on the join table, not here — see ProblemStage below. |
| difficulty | Enum(Easy, Medium, Hard)? | optional — a roadmap-only problem not yet matched to a companywise import row has no known difficulty until then (see spec 003) |
| source_link | String? | optional |
| is_solved | Boolean | default false — roll-up: true when the problem is solved in at least one placement. The per-stage source of truth is `ProblemStage.is_solved` (see below) |
| is_premium | Boolean | default false — LeetCode Premium required to view |
| note | String? | optional — short inline context (e.g. "bridges toward Heap — see Stage 13", "also in Stage 2 via a different technique") |
| companies | Company[] | many-to-many, via join table |

### ProblemStage (join table)
| field | type | notes |
|---|---|---|
| problem_id | String | FK → Problem |
| stage_id | String | FK → Stage |
| roadmap_order | Int | global sequence position **of this placement** — a problem in two stages has two rows here, each with its own order |
| tier | Enum(Core, Supp, Stretch) | per-placement, since the same problem can be a different tier depending on which technique/stage it's being drilled for |
| is_priority | Boolean | default false, per-placement |
| is_solved | Boolean | default false, per-placement — added 2026-09-20 so a problem in two stages (LC 268) can be ticked independently in each. `Problem.is_solved` is kept in sync as the roll-up |

### Resource
| field | type | notes |
|---|---|---|
| id | String (cuid) | PK |
| title | String | |
| topic | String? | free text, optional |
| type | Enum(OAReport, InterviewExperience, Article, CoreSubject, Aptitude, Other) | |
| link | String? | optional |
| note | String? | optional |
| credibility | Enum(High, Medium, Low) | |
| date_added | DateTime | default now() |
| companies | Company[] | many-to-many, via join table, zero-or-more |

### Join tables
- `ProblemStage` (problem_id, stage_id, roadmap_order, tier, is_priority, is_solved) — many-to-many, a problem may belong to more than one stage (different technique/rep), each placement carrying its own order/tier/priority/solved state.
- `ProblemCompany` (problem_id, company_id) — many-to-many, a problem may belong to multiple companies.
- `ResourceCompany` (resource_id, company_id) — many-to-many, a resource may belong to zero, one, or multiple companies.

## Confirmed decisions (from discussion)

- `Resource.topic` is free text, not a fixed taxonomy. No auto-tagging/matching in v1 — plain stored string, searched by simple filter later.
- Problem↔Company and Resource↔Company are both many-to-many. This is central to the tool: the same problem/resource must be visible under every company it's relevant to, so cross-company progress is accurate.
- Problem↔Stage is many-to-many (not a single FK), decided when the roadmap data revealed a problem intentionally drilled twice via two different techniques (LC 268 Missing Number, in both Stage 2 and Stage 22). `roadmap_order`/`tier`/`is_priority` live on the `ProblemStage` join row, since they describe a specific placement, not the problem itself.
- `Problem.leetcode_id` (unique, optional Int) stores LeetCode's own numeric problem ID — added as the stable match key between the companywise import (spec 002) and the roadmap import (spec 003), instead of matching on title text.
- `Problem.is_premium` and `Problem.note` added to carry through the `(premium)` tags and inline bridging/context annotations present in the roadmap source (spec 003).
- **Solved state is per placement (2026-09-20).** `ProblemStage.is_solved` drives the roadmap checkboxes and per-stage counts; `Problem.is_solved` stays as the roll-up ("solved in at least one placement") for problem-level views such as the headline count. Decided so LC 268 can be solved once per technique (Stage 2 and Stage 22) without ticking one placement marking the other. Migration: `add_placement_solved`.
- No AI/LLM involved anywhere in this step or in v1 generally.

## Acceptance criteria

- [ ] `prisma/schema.prisma` defines Company, Stage, Problem, Resource, ProblemStage, and the other join relations.
- [ ] `npx prisma migrate dev` runs clean against a local Postgres instance and creates all tables.
- [ ] `npx prisma generate` succeeds and Prisma Client can be imported in the project without type errors.
- [ ] A throwaway script (deleted after verification, not committed) can create one Company, one Stage, one Problem linked to that Company via a ProblemStage row, and one Resource linked to that same Company — confirming the many-to-many relations work in both directions.
- [ ] The same script confirms a second ProblemStage row can link that same Problem to a second Stage (simulating the LC 268-style double placement) without violating any constraint.
- [ ] No pages, routes, or seed data added in this step.

## Open questions

None — all prior open decisions for this step were resolved in discussion (see "Confirmed decisions" above).
