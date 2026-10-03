// Spec 011: flagging a question and saying why. Pure (no database) so client components can use it.
// The reasons mirror the user's curation rules in docs/quiz-question-patterns.md, so a flag is one
// click and what gets flagged is exactly what a later question generator should avoid.

export const FEEDBACK_REASONS = [
  { key: 'TooEasy', label: 'Too easy' },
  { key: 'Repetitive', label: 'Repetitive' },
  { key: 'WrongAnswer', label: 'Wrong answer' },
  { key: 'UnclearWording', label: 'Unclear wording' },
  { key: 'ExplanationOff', label: 'Explanation is off' },
  { key: 'HighlightOff', label: 'Highlight is off' },
  { key: 'Other', label: 'Other' },
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]['key'];

export const MAX_FEEDBACK_COMMENT = 1000;

export type QuestionFeedback = { reason: FeedbackReason; comment: string | null };

export function isFeedbackReason(value: unknown): value is FeedbackReason {
  return typeof value === 'string' && FEEDBACK_REASONS.some((r) => r.key === value);
}

export function reasonLabel(reason: FeedbackReason): string {
  return FEEDBACK_REASONS.find((r) => r.key === reason)?.label ?? reason;
}

// Trims the comment; empty becomes null. Throws if it is too long, so the server action and the
// form agree on the limit.
export function cleanComment(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  if (text.length > MAX_FEEDBACK_COMMENT) throw new Error(`Keep the note under ${MAX_FEEDBACK_COMMENT} characters.`);
  return text === '' ? null : text;
}
