'use client';

import { useState, useTransition } from 'react';
import { markSolvedByLeetcodeIds, type BulkSolvedResult } from '@/app/actions';

export function BulkSolvedForm() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<BulkSolvedResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const changed = result ? result.marked.length + result.multiStage.length : 0;

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="1, 2, 3, 141, 268 …"
        aria-label="LeetCode IDs"
        className="w-full rounded-md border bg-background p-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <div>
        <button
          type="button"
          disabled={isPending || text.trim() === ''}
          onClick={() =>
            startTransition(async () => {
              setResult(await markSolvedByLeetcodeIds(text));
            })
          }
          className="rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {isPending ? 'Marking…' : 'Mark as solved'}
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-4 text-sm">
          <p className="font-medium">
            Marked {changed} solved · {result.alreadySolved.length} already solved · {result.notFound.length} not
            found
            {result.invalid.length > 0 && ` · ${result.invalid.length} not a number`}
          </p>

          {result.multiStage.length > 0 && (
            <div>
              <p className="text-muted-foreground">
                In several stages, so only the earliest was ticked. Tick the others by hand if you solved them there too:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {result.multiStage.map((m) => (
                  <li key={m.leetcodeId}>
                    LC {m.leetcodeId} {m.title} — ticked in {m.markedStage}; also in {m.otherStages.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.notFound.length > 0 && (
            <p>
              <span className="text-muted-foreground">Not found (nothing changed): </span>
              {result.notFound.join(', ')}
            </p>
          )}
          {result.invalid.length > 0 && (
            <p>
              <span className="text-muted-foreground">Ignored: </span>
              {result.invalid.join(', ')}
            </p>
          )}
          {result.alreadySolved.length > 0 && (
            <p>
              <span className="text-muted-foreground">Already solved, skipped: </span>
              {result.alreadySolved.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
