'use client';

import { useTransition } from 'react';
import { toggleSolved } from './actions';

export function SolvedCheckbox({ problemId, isSolved }: { problemId: string; isSolved: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      className="solved-checkbox"
      defaultChecked={isSolved}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(() => {
          toggleSolved(problemId, next);
        });
      }}
      aria-label="Mark solved"
    />
  );
}
