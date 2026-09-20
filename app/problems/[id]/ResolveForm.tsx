'use client';

import { useState, useTransition } from 'react';
import { logSolve } from '@/app/actions';

// Re-solve: adds another solve to the history. A problem in several stages needs a stage
// (recorded on the history row); otherwise the choice is implied.
export function ResolveForm({
  problemId,
  stages,
}: {
  problemId: string;
  stages: { id: string; label: string }[];
}) {
  const needsStage = stages.length > 1;
  const [stageId, setStageId] = useState(stages[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsStage && (
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          aria-label="Stage this solve belongs to"
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => logSolve(problemId, needsStage ? stageId : null))}
        className="h-8 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {isPending ? 'Logging…' : 'Solved it again'}
      </button>
    </div>
  );
}
