import type { HighlightSpec } from '../../lib/quizHighlight';

// The shape every per-problem quiz seed shares (spec 011), so one script (prisma/scripts/
// seed-quiz.ts) can store any of them. A seed is the user's own code for one problem plus the
// questions written against it.

export type SeedCategory =
  | 'Intuition'
  | 'CodeReading'
  | 'Tracing'
  | 'EdgeCase'
  | 'Complexity'
  | 'Counterfactual'
  | 'FinalUnderstanding';

// Run against the user's REAL C++ (g++) by the seed script: the vector the function returns for
// `input` must equal `expect`. Only given where that outcome logically fixes the answer key (a
// final result, a stack after n elements, a pop count). With `variant`, the code is first changed
// by replacing the text `replace` with `with` (exactly one occurrence), so a counterfactual such
// as "what if < became <=" is checked by running the changed code.
export type SeedCheck = {
  input: number[];
  expect: number[];
  variant?: { replace: string; with: string };
};

export type SeedQuestion = {
  key: string;
  // A free-form label for where the question came from; stored, but not shown anywhere.
  set: string;
  category: SeedCategory;
  text: string;
  snippet?: string;
  // In the order written; the quiz shuffles the display order every time.
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  check?: SeedCheck;
};

export type QuizSeed = {
  leetcodeId: number;
  approachName: string;
  // The C++ function the checks call; it must take vector<int>& and return vector<int>.
  functionName: string;
  code: string;
  questions: SeedQuestion[];
  // One per question, by key. The seed script refuses a missing or orphaned one.
  explanations: Record<string, string>;
  // Optional per question, by key: the lines of `code` the explanation is about. No entry = none.
  highlights: Record<string, HighlightSpec[]>;
};
