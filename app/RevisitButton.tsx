'use client';

import { useEffect, useState, useTransition } from 'react';
import { logReview } from './actions';

// One button, one counter: each click logs a 'Revisited' event and the shown count goes up
// immediately (optimistic; resynced from the server count if it ever changes from elsewhere).
export function RevisitButton({ problemId, count }: { problemId: string; count: number }) {
  const [localCount, setLocalCount] = useState(count);
  useEffect(() => setLocalCount(count), [count]);
  const [pending, startTransition] = useTransition();

  function click() {
    setLocalCount((c) => c + 1);
    startTransition(() => {
      logReview(problemId, null, 'Revisited');
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={click}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      Revisited?
      <span className="tabular-nums text-foreground">{localCount}</span>
    </button>
  );
}
