'use client';

import { useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { checkQuizPrompt, toggleSolved } from './actions';
import { QuizPromptDialog } from './QuizPromptDialog';

// stageId is null for a problem with no roadmap placement (solved at problem level).
// onToggle lets the parent react to a tick straight away (e.g. open the rating picker).
// Ticking a problem that has a quiz also offers it in a dismissable popup (spec 011 F1).
export function SolvedCheckbox({
  problemId,
  stageId,
  isSolved,
  onToggle,
}: {
  problemId: string;
  stageId: string | null;
  isSolved: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [quizPrompt, setQuizPrompt] = useState<{ title: string } | null>(null);

  return (
    <>
      <Checkbox
        // Re-mount when the saved value changes so the box never drifts from the database.
        key={String(isSolved)}
        defaultChecked={isSolved}
        disabled={isPending}
        onCheckedChange={(checked) => {
          const next = checked === true;
          onToggle?.(next);
          startTransition(() => {
            toggleSolved(problemId, stageId, next);
          });
          if (next) {
            // A failed lookup just means no popup; the tick itself is unaffected.
            checkQuizPrompt(problemId).then(setQuizPrompt, () => {});
          }
        }}
        aria-label="Mark solved"
      />
      {quizPrompt && (
        <QuizPromptDialog problemId={problemId} title={quizPrompt.title} onClose={() => setQuizPrompt(null)} />
      )}
    </>
  );
}
