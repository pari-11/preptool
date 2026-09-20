// Confidence is stored as an integer 1-5 on Problem.confidence (null = unrated).
// The labels are UI copy only; see spec 005 decision 5.
export const CONFIDENCE_LEVELS = [
  { value: 1, label: "Couldn't solve it", hint: 'Would fail again' },
  { value: 2, label: 'Needed the solution', hint: 'Read or copied the answer' },
  { value: 3, label: 'Lots of struggle or hints', hint: 'Got there, but not cleanly' },
  { value: 4, label: 'Some hesitation', hint: 'Solved with a few wobbles' },
  { value: 5, label: 'Got it cold', hint: 'No trouble at all' },
] as const;

export function isValidConfidence(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function confidenceLabel(value: number): string {
  return CONFIDENCE_LEVELS.find((l) => l.value === value)?.label ?? '';
}
