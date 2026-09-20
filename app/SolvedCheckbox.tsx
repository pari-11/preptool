'use client';

import { useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleSolved } from './actions';

export function SolvedCheckbox({
  problemId,
  stageId,
  isSolved,
}: {
  problemId: string;
  stageId: string;
  isSolved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Checkbox
      defaultChecked={isSolved}
      disabled={isPending}
      onCheckedChange={(checked) => {
        const next = checked === true;
        startTransition(() => {
          toggleSolved(problemId, stageId, next);
        });
      }}
      aria-label="Mark solved"
    />
  );
}
