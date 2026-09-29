// Confidence is stored as an integer 1-5 on Problem.confidence (null = unrated).
// Meaning is ease of solving / pattern recognition (changed from struggle-to-solve on 2026-09-28,
// see CLAUDE.local.md Part 3). The labels are UI copy only; see spec 005 decision 5.
export const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Struggled long, pattern unclear', hint: 'Took a lot of time to understand the solution; pattern was hard' },
  { value: 2, label: 'Took time, pattern tricky', hint: 'Needed some time to understand; pattern was medium-difficult' },
  { value: 3, label: 'Needed sol, pattern clicked', hint: 'Checked solution but idea had formed; pattern was understandable' },
  { value: 4, label: 'Quick check, pattern easy', hint: 'Got the logic, checked solution just to confirm' },
  { value: 5, label: 'Instant, pattern obvious', hint: 'Barely needed the solution, easy to understand' },
] as const;

export function isValidConfidence(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function confidenceLabel(value: number): string {
  return CONFIDENCE_LEVELS.find((l) => l.value === value)?.label ?? '';
}
