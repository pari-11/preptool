'use client';

import { useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleSolved } from './actions';

// stageId is null for a problem with no roadmap placement (solved at problem level).
// onToggle lets the parent react to a tick straight away (e.g. open the rating picker).
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

  return (
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
      }}
      aria-label="Mark solved"
    />
  );
}
