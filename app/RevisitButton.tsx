'use client';

import { useEffect, useState, useTransition } from 'react';
import { Undo2 } from 'lucide-react';
import { logReview, undoRevisit } from './actions';

// One button, one counter: each click logs a 'Revisited' event and the shown count goes up
// immediately (optimistic; resynced from the server count if it ever changes from elsewhere).
// Undo removes the most recent Revisited row only, for an accidental click; it's hidden at 0
// since there's nothing to undo.
export function RevisitButton({ problemId, count }: { problemId: string; count: number }) {
  const [localCount, setLocalCount] = useState(count);
  useEffect(() => setLocalCount(count), [count]);
  const [pending, startTransition] = useTransition();

  function revisit() {
    setLocalCount((c) => c + 1);
    startTransition(() => {
      logReview(problemId, null, 'Revisited');
    });
  }

  function undo() {
    setLocalCount((c) => Math.max(0, c - 1));
    startTransition(() => {
      undoRevisit(problemId);
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={revisit}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        Revisited?
        <span className="tabular-nums text-foreground">{localCount}</span>
      </button>
      {localCount > 0 && (
        <button
          type="button"
          disabled={pending}
          onClick={undo}
          title="Undo the last revisit"
          aria-label="Undo the last revisit"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Undo2 className="size-4" />
        </button>
      )}
    </div>
  );
}
