# Spec 011 — Quiz Mode (post-solve understanding quiz)

Status: Draft — not built. Rewritten 2026-10-01 around the user's description; the earlier 10-second flashcard design is dropped. Updated 2026-10-02: reference-solution source chosen (NeetCode repo, D10), language fixed to C++ for now (D11), and the build order set to a hand-seeded first slice (D12) before any LLM generation.
Depends on: 005 (write path: solve ticking, `confidence`, `ReviewLog`), 010 (`/problems/[id]` page layout, header nav).
Phase: not yet placed in CLAUDE.local.md's phase list; the user decides where it lands.
Companion file: [docs/quiz-question-patterns.md](../docs/quiz-question-patterns.md) — the full taxonomy of question types the user wants, taken from their asteroid-collision samples. That file defines *what kind of questions*; this spec defines the feature around them.

## Goal

After solving a problem, test whether the user actually understands the approach they used — not just that they got it accepted. A quiz of multiple-choice questions, basic to hard, built from a standard solution of that approach, reassesses the user's mental model of the problem.

## Flow

F1. **Three entry points to one problem's quiz:**
   - It opens automatically (popup or page, decided at build time) right after the user ticks a problem solved.
   - A **"Go to Quiz"** button on every problem page (`/problems/[id]`).
   - A standalone **Quiz section** in the header nav (a "Reinforcement" page, similar to Companies), listing problems with quizzes so the user can open any one later.
F2. **Pick the approach used.** A problem has one or more standard approaches (typically 2–4, e.g. brute force, optimal) plus any approaches the user added. The first screen lists them all as cards. Selecting one opens that approach's questions, which already exist (stored, not built on the spot) for a standard approach.
F2a. **"View solution" link under each approach name**, pointing to that approach's solution on NeetCode or another source, so a user who does not know which approach matches theirs can read it first. Opens in a new tab. An approach with no known link shows no button.
F2b. **"Add my approach"**, on the same screen: the user pastes their own solution code (and optionally names it). It is saved against that problem and appears on its quiz page alongside the standard approaches, marked as the user's own. Its questions are built from that code and [docs/quiz-question-patterns.md](../docs/quiz-question-patterns.md) (D7). Editing the saved code regenerates its questions; deleting it removes the approach and its questions and attempts.
F3. **Questions for that approach**, basic to difficult, as 4-option MCQs following [docs/quiz-question-patterns.md](../docs/quiz-question-patterns.md): intuition, code reading, tracing, complexity, edge cases, counterfactuals, and a closing mental-model question. Option order is shuffled each time.
F4. **Answering and feedback.** The user picks an option; the app shows whether it was right and a short explanation, then moves on. A summary at the end shows the score and links back to the problem.
F5. **Dismissable.** The auto-open after ticking must be skippable in one click; ticking a problem must never be blocked by the quiz.

## Decisions

D1. **Accuracy comes first, so reference solutions are the source of truth, not LLM memory.** The user explicitly refuses an all-LLM approach. Approaches, reference code and complexity must come from a standard, trusted solution source. An LLM, if used at all, only restructures that real content into questions; it does not invent solutions.
D2. **Trace questions are machine-verifiable.** Where a question asks "given this state, what happens / what is the result", the answer is computed by running the reference code, so a wrong answer key is caught automatically. Conceptual questions (why a stack, the mental model) cannot be machine-checked; those are flagged as generated and editable.
D3. **Quizzes are stored, not generated live.** Generation is an offline batch script in `prisma/scripts/` (re-runnable, idempotent, like the import scripts). The app only reads stored rows, so a quiz is fast and costs nothing per use.
D4. **Quiz results are a separate signal from `confidence`.** `confidence` is the user's own rating of ease at solve time. Quiz scores are stored separately and do not change `confidence`, `ReviewLog` or the review queue in this spec.
D5. **Solved problems only** (or any problem the user opens directly from the Quiz section; the post-solve auto-open applies to problems just ticked).
D6. **Single implicit user**, as everywhere else.
D7. **Two question sources.** *Standard approaches* get pre-built, stored questions from the offline batch (D1–D3); no LLM at quiz time. *User-added approaches* are the one place an LLM is used: when the user saves pasted code, one call writes the questions from that code following the patterns file, and the result is stored and reused (regenerated only if the code is edited). This is the app's first LLM use; CLAUDE.local.md currently says no LLM in v1, so that note changes when this is built. It needs an Anthropic API key in `.env`.
D8. **User-approach questions are not machine-verifiable** (running arbitrary pasted code in any language is out). They are labelled "generated from your code", `verified = false`, and the user can flag or delete a bad question. If the pasted code is itself wrong, the questions inherit that; a note on the screen says so.
D9. **LLM provider: a fallback chain behind one function, not yet confirmed.** Nothing here is final; the user is still deciding. Current leaning, to be confirmed after checking each provider's console limits at signup: **Mistral (primary) → Gemini → NVIDIA NIM → Z.ai**. All four expose an OpenAI-style API, so each is a base URL, key and model name in `.env`; a provider with no key is skipped; a rate-limit error, timeout or failure moves to the next; if all fail the user sees "couldn't generate questions, try again" and their saved code is untouched. Each stored question set records which model wrote it. Free-tier details are in the table below.
D10. **Reference-solution source: NeetCode's public repo, [neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode)** (MIT, active). Checked against the user's roadmap on 2026-10-02 by cloning it: 154 roadmap problems; 149 are on NeetCode's list (not: LC 16, 442, 643, 713, 2461); 149 have a NeetCode video ID and 148 a C++ file. Its `articles/` folder gives named approaches with intuition, algorithm, tabbed code and time/space complexity: **82 roadmap problems matched by slug have an article, each with 2–7 approaches (10 with 2, 23 with 3, 27 with 4, 14 with 5, 5 with 6, 3 with 7), all with a C++ tab and complexity text.** The "View solution" link (F2a) comes from `.problemSiteData.json` (NeetCode page slug and video ID), so no scraping. **Known gap, deferred by the user:** the other 67 problems have no article matched yet, because NeetCode renamed many articles (LC 217 is `duplicate-integer.md`, LC 121 is `buy-and-sell-crypto.md`) while its site data still uses LeetCode slugs; some of those 67 likely have a renamed article, so the real ceiling is between 82 and 149 and needs a one-time title-matching table. Until then those problems show "no quiz yet" with the NeetCode video link, and "Add my approach" still works. One caveat: the repo's MIT licence covers `articles/` as far as the README says, but no separate terms for the article text were found either way. A second MIT source, `walkccc/LeetCode` (C++, Python, Java), was identified but not measured; `doocs/leetcode` is CC-BY-SA-4.0 and is avoided.
D11. **Language: C++ only for now.** Solution code, trace answers and questions are all C++. Later, the user's solving language becomes an option asked during onboarding, and the quiz content is linked on that basis. Nothing about it is built now.
D12. **Build order: hand-seeded first (option B), LLM generation after.** The first slice needs no LLM and no API key: the user's own asteroid-collision questions (~55, two sets: the first 15, then the next 40) are stored as seed data, and the quiz flow is built around them (popup after ticking, "Go to Quiz", Quiz nav page, approach picker with NeetCode links, shuffled MCQs, feedback, scoring, saved attempts). The user tests the flow and reviews the questions before any generation spend; the LLM batch (standard approaches) and "Add my approach" generation follow once the flow feels right.
D13. **Seeded asteroid questions attach to a "Stack (your solution)" approach** holding the user's own code (the `destroyed` / `abs` / `reverse` version the questions were written against), not NeetCode's article approach, which uses a different stack solution. NeetCode's standard approach for LC 735 gets generated questions later.
D14. **Every question is tagged with a pattern category** from [docs/quiz-question-patterns.md](../docs/quiz-question-patterns.md) (intuition, code reading, tracing, complexity, edge case, counterfactual, final understanding). The user will review all the asteroid questions in the app, one pattern at a time if they like; any *pattern* they dislike is dropped for good, and that rule is recorded in the patterns file so later generation inherits it. Both seed sets are stored as given, **overlaps included** — the user reviews and prunes; nothing is deduplicated silently.
D15. **Answer keys for the seed are derived by tracing the user's code**, since the samples carry no key. The correct option is shuffled to a random position every time (in the samples it was always A). Any question whose answer is unclear from the code is flagged for the user, not guessed.

## Data (outline)

- A per-problem **approach** record: problem, approach name, ordered, reference code, key idea, time and space complexity, solution link (nullable, F2a), `origin` (`standard` | `user`). A user approach stores the pasted code and optional name; a standard one is created only by the batch script.
- A per-approach **question** record: category (the pattern tag, D14), difficulty tier, question text, optional code snippet, four options with the correct one marked, explanation, `verified` flag (true when the answer was computed by executing the reference code), `origin` (`imported` | `generated` | `user-edited`).
- A **quiz attempt** record: problem, approach chosen, started/finished at, score, and the per-question answers.
- All additive migrations; no change to existing tables or queries.

## LLM provider research (not confirmed)

Researched 2026-10-01. Figures marked ✔ come from the provider's own page; the rest are third-party blog claims and must be checked in each provider's console before relying on them. Free tiers change often (Cerebras, SambaNova and GitHub Models all lost theirs in 2026), which is why the provider sits behind one function.

| Provider | Free tier | Limits | Catches |
|---|---|---|---|
| Mistral (primary) | "Experiment" plan, $0, no card; all API models incl. Mistral Large and Codestral | ~1 req/s, ~500K tokens/min, ~1B tokens/month; Mistral reportedly no longer publishes them (check Admin Console → Limits) | Phone verification; opt in to data training; official page not reachable, so unconfirmed |
| Gemini (fallback 1) | Flash and Flash-Lite only (Pro paid-only since Apr 2026); free input/output tokens and context caching ✔ | Not published in the docs, shown per account in AI Studio ✔; blogs say ~10-15 req/min and ~1,500/day (sources disagree); daily limit resets midnight Pacific ✔ | Free-tier content is used to improve Google products ✔ |
| NVIDIA NIM (fallback 2) | Free via the NVIDIA Developer Program, no card; Nemotron, GLM, Kimi K2, Gemma and 100+ models | ~40 req/min across the key; ~1,000 credits at signup reported (possibly a one-off, unclear) | No way to raise the free limit; higher usage means paying ✔ (forum); evaluation endpoint; official FAQ not reachable |
| Z.ai (last backup) | GLM-4.7-Flash, GLM-4.5-Flash, GLM-4.6V-Flash: input, cached input and output all "Free" ✔ | Not stated on the pricing page ✔ | GLM-5.3-Flash is not free (discounted only to 9 Sept 2026) |

Considered and rejected: Kimi's own API (prepaid, no free tier), Cerebras (card needed, 30-day $5 credit), SambaNova (no credits for new accounts), GitHub Models (retired July 2026), Hugging Face (~$0.10/month), Qwen/Alibaba (1M tokens per model for 90 days, then paid), DeepSeek (5M tokens for 30 days, then ~$0.27/$1.10 per 1M; kept as a possible paid backstop). Local Ollama (e.g. Qwen3-Coder) is unlimited but only works while the user's PC runs it, so it fails once deployed. Data from the free tiers above is used for training or sent to servers in China (Z.ai) or Google; only LeetCode solution code should ever be sent.

## Scope

In scope: schema and migration for approaches/questions/attempts; the batch script that builds approaches and questions from the chosen source (D1–D3); the quiz flow (F1–F5): the post-tick popup/page, the "Go to Quiz" button, the Quiz section page; recording attempts; shuffling options.

Out of scope: generating quizzes for unsolved or non-LeetCode items; quiz results feeding `confidence`, the review queue, the dashboard or the calendar; a question-editing UI beyond what D2's "editable" flag needs (decided at build time); spaced repetition of quizzes; timers; LLM-generated *solutions* (the LLM only writes questions about code the user pasted, D7); running or testing pasted code; sharing approaches across users.

## Acceptance criteria

- [ ] **First slice (D12):** the ~55 asteroid-collision questions are stored under a "Stack (your solution)" approach for LC 735, each tagged with a pattern category, and a review view lists them all, filterable by pattern.
- [ ] Every seeded question's stored answer matches a trace of the user's code (D15); the correct option appears in a different position across runs.
- [ ] Ticking a problem solved opens its quiz (dismissable in one click); ticking itself still works whether or not the quiz is opened.
- [ ] Every problem page has a "Go to Quiz" button that opens that problem's quiz; it is disabled or hidden with an explanation for a problem that has no quiz yet.
- [ ] A Quiz section in the header lists problems that have quizzes and opens any one.
- [ ] The quiz first asks which approach was used, offering exactly the approaches stored for that problem.
- [ ] Each standard approach card has a "View solution" button opening its source link in a new tab; an approach without a link shows none.
- [ ] "Add my approach" saves pasted code against the problem; it then appears on that problem's quiz page marked as the user's own, and survives a reload.
- [ ] Saving a user approach produces stored questions built from the pasted code, labelled "generated from your code"; the LLM is called once at save, not on each quiz open; editing the code regenerates them; deleting the approach removes it, its questions and its attempts.
- [ ] Standard-approach quizzes make no LLM call at quiz time.
- [ ] After choosing, questions are served basic to difficult for that approach only, each a 4-option MCQ with one correct answer, with options in a shuffled order.
- [ ] After each answer the app shows right/wrong and an explanation; the end shows the score.
- [ ] Every trace-type question's stored answer matches the output of running the reference code (D2); any that does not is excluded.
- [ ] Attempts are recorded; `confidence`, `ReviewLog` and the review queue are unchanged by a quiz.
- [ ] Re-running the batch script does not duplicate approaches or questions and does not overwrite user-edited ones.
- [ ] No existing query (Next up, review queue, strengths/weaknesses, calendar, company view, search) is modified.

## Verification

Not yet built. When built (first slice first): all writes tested on an isolated rig, never the live database; the answer-verification step (D2) tested with fixtures including a deliberately wrong key; note anything not clicked in a real browser.

## Open items

- **Closing the 67-problem article gap (D10)**: a one-time mapping from LeetCode ID to NeetCode's renamed article files, by title matching and review. The user said the gaps matter but to look at them later.
- How the *standard* approaches' questions get authored: the batch script needs either an LLM writing the conceptual questions from verified reference code, or another authoring route. D7 settles the LLM for user-added approaches only.
- **Provider choice and order (D9) is not confirmed**; check real limits in each console at signup, and test question quality on the asteroid samples before settling.
- Which languages "Add my approach" accepts (any text is storable; the LLM handles most), and a size limit on pasted code.
- Whether to skip unverified user-approach questions instead of showing them labelled (D8).
- Whether the user reviews generated questions before they appear, or trusts verified ones.
- Quiz length: the samples ran 15–40 questions, likely too many for one sitting; options are tiers (basic first, hard optional) or a cap per attempt.
- Meaning of the `**` option markers in the user's samples (see the patterns file); the user did not follow the question and it is being re-asked.
- Whether the batch (after the seed slice) starts with the 82 matched problems or only ones the user has solved.
- Where the feature sits in CLAUDE.local.md's phase list.
