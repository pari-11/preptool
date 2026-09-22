'use client';

import { useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { logReview, logSolve } from './actions';

type Kind = 'Resolved' | 'Revised' | 'Revisited';

const OPTIONS: { kind: Kind; label: string }[] = [
  { kind: 'Resolved', label: 'Resolved' },
  { kind: 'Revised', label: 'Revised' },
  { kind: 'Revisited', label: 'Revisited' },
];

// Three logging checkboxes, not persistent toggles: a problem can be resolved, revised or
// revisited any number of times, so there's no lasting "checked" state to represent. Checking one
// logs that event and the box clears itself once it's recorded. 'Resolved' here reuses the same
// logSolve() the problem page's Re-solve button uses — this is not a second solved/unsolved
// toggle, just another way to log a fresh solve. stageId is a best-effort placement to attribute
// the log to (the caller picks one; a problem in several stages still has its own per-placement
// checkboxes and Re-solve stage picker elsewhere for the exact case that matters).
export function LogReview({ problemId, stageId }: { problemId: string; stageId: string | null }) {
  const [pending, startTransition] = useTransition();
  const [justLogged, setJustLogged] = useState<Kind | null>(null);

  function log(kind: Kind) {
    setJustLogged(kind);
    startTransition(async () => {
      if (kind === 'Resolved') {
        await logSolve(problemId, stageId);
      } else {
        await logReview(problemId, stageId, kind);
      }
      setTimeout(() => setJustLogged(null), 700);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" role="group" aria-label="Log a review">
      {OPTIONS.map(({ kind, label }) => (
        <label key={kind} className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
          <Checkbox
            checked={justLogged === kind}
            disabled={pending}
            onCheckedChange={(checked) => checked && log(kind)}
            aria-label={`Log ${label.toLowerCase()}`}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
