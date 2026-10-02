import type { QuizCategory } from '@prisma/client';

// Pure (no database) so client components can use it too. See lib/quiz.ts for the queries.

// Display order is the difficulty order from docs/quiz-question-patterns.md, and the labels are
// the pattern names the user reviews and drops questions by.
export const QUIZ_CATEGORIES: { key: QuizCategory; label: string; hint: string }[] = [
  { key: 'Intuition', label: 'Intuition', hint: 'Why this structure, which element matters first' },
  { key: 'CodeReading', label: 'Code reading', hint: 'What a line, variable or condition does' },
  { key: 'Tracing', label: 'Tracing', hint: 'Given this state, what happens' },
  { key: 'EdgeCase', label: 'Edge cases', hint: 'Short inputs that sit on the boundary' },
  { key: 'Complexity', label: 'Complexity', hint: 'Time and space, and the common misconceptions' },
  { key: 'Counterfactual', label: 'Counterfactual', hint: 'What breaks if this is removed' },
  { key: 'FinalUnderstanding', label: 'Final understanding', hint: 'The whole algorithm and the mental model' },
];

const CATEGORY_KEYS = new Set<string>(QUIZ_CATEGORIES.map((c) => c.key));

export function categoryLabel(key: QuizCategory): string {
  return QUIZ_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function isQuizCategory(value: string | undefined | null): value is QuizCategory {
  return !!value && CATEGORY_KEYS.has(value);
}
