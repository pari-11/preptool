'use client';

import { useState, useTransition } from 'react';
import { Flag } from 'lucide-react';
import { FEEDBACK_REASONS, MAX_FEEDBACK_COMMENT, reasonLabel, type FeedbackReason, type QuestionFeedback } from '@/lib/quizFeedback';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { flagQuizQuestion, unflagQuizQuestion } from '@/app/actions';

// Spec 011 feedback: a flag on one question with a reason and an optional note. Meant to sit in a
// question's header row (a flex-wrap row): the button is pushed to the right and the panel takes
// its own full-width line underneath. The parent owns the saved value (`feedback`) and is told of
// every change through `onChange`, so the card, the Flagged count and the quiz all stay in step.
export function FlagButton({
  questionId,
  feedback,
  onChange,
}: {
  questionId: string;
  feedback: QuestionFeedback | null;
  onChange: (next: QuestionFeedback | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!open) {
      // Start from what is saved, so reopening edits the existing flag.
      setReason(feedback?.reason ?? null);
      setComment(feedback?.comment ?? '');
      setError(null);
    }
    setOpen(!open);
  }

  function save() {
    if (!reason) {
      setError('Pick a reason first.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const saved = await flagQuizQuestion(questionId, reason, comment);
        onChange(saved);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the flag.');
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        await unflagQuizQuestion(questionId);
        onChange(null);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove the flag.');
      }
    });
  }

  const flagged = feedback !== null;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={flagged ? `Flagged: ${reasonLabel(feedback.reason)}${feedback.comment ? ' — ' + feedback.comment : ''}` : 'Flag this question'}
        className={cn(
          'ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
          flagged
            ? 'border-amber-400 bg-amber-500/15 text-amber-700 dark:border-amber-600 dark:text-amber-400'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Flag className={cn('size-3.5', flagged && 'fill-amber-500 text-amber-500')} />
        {flagged ? reasonLabel(feedback.reason) : 'Flag'}
      </button>

      {open && (
        <div className="flex basis-full flex-col gap-2.5 rounded-lg border bg-muted/40 p-3 text-sm text-foreground">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reason for the flag">
            {FEEDBACK_REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={reason === r.key}
                onClick={() => setReason(r.key)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  reason === r.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_FEEDBACK_COMMENT}
            rows={2}
            placeholder="What would you change? (optional)"
            aria-label="Note about this question"
            className="w-full resize-y rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={pending} onClick={save} className={buttonVariants({ size: 'sm' })}>
              {flagged ? 'Update flag' : 'Save flag'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Cancel
            </button>
            {flagged && (
              <button
                type="button"
                disabled={pending}
                onClick={remove}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'ml-auto text-rose-600 dark:text-rose-400')}
              >
                Remove flag
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
