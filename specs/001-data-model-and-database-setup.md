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
| difficulty | Enum(Easy, Medium, Hard) | |
| source_link | String? | optional |
| is_solved | Boolean | default false |
| companies | Company[] | many-to-many, via join table |

### ProblemStage (join table)
| field | type | notes |
|---|---|---|
| problem_id | String | FK → Problem |
| stage_id | String | FK → Stage |
| roadmap_order | Int | global sequence position **of this placement** — a problem in two stages has two rows here, each with its own order |
| tier | Enum(Core, Supp, Stretch) | per-placement, since the same problem can be a different tier depending on which technique/stage it's being drilled for |
| is_priority | Boolean | default false, per-placement |

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
- `ProblemStage` (problem_id, stage_id, roadmap_order, tier, is_priority) — many-to-many, a problem may belong to more than one stage (different technique/rep), each placement carrying its own order/tier/priority.
- `ProblemCompany` (problem_id, company_id) — many-to-many, a problem may belong to multiple companies.
- `ResourceCompany` (resource_id, company_id) — many-to-many, a resource may belong to zero, one, or multiple companies.

## Confirmed decisions (from discussion)

- `Resource.topic` is free text, not a fixed taxonomy. No auto-tagging/matching in v1 — plain stored string, searched by simple filter later.
- Problem↔Company and Resource↔Company are both many-to-many. This is central to the tool: the same problem/resource must be visible under every company it's relevant to, so cross-company progress is accurate.
- Problem↔Stage is many-to-many (not a single FK), decided when the roadmap data revealed a problem intentionally drilled twice via two different techniques (LC 268 Missing Number, in both Stage 2 and Stage 22). `roadmap_order`/`tier`/`is_priority` live on the `ProblemStage` join row, since they describe a specific placement, not the problem itself.
- `Problem.leetcode_id` (unique, optional Int) stores LeetCode's own numeric problem ID — added as the stable match key between the companywise import (spec 002) and the roadmap import (spec 003), instead of matching on title text.
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
