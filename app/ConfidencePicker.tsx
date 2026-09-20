'use client';

import { useTransition } from 'react';
import { CONFIDENCE_LEVELS } from '@/lib/confidence';
import { cn } from '@/lib/utils';
import { setConfidence } from './actions';

// One-click 1-5 rating. Clicking the current value again clears it back to unrated.
export function ConfidencePicker({
  problemId,
  current,
  onDone,
  showLabels = false,
}: {
  problemId: string;
  current: number | null;
  onDone?: () => void;
  showLabels?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Confidence, 1 to 5">
      {CONFIDENCE_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          disabled={isPending}
          title={`${level.value} — ${level.label}`}
          onClick={() => {
            const next = current === level.value ? null : level.value;
            startTransition(async () => {
              await setConfidence(problemId, next);
              onDone?.();
            });
          }}
          className={cn(
            'inline-flex h-6 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-50',
            showLabels ? 'gap-1.5' : 'w-6 px-0',
            current === level.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {level.value}
          {showLabels && <span className="font-normal">{level.label}</span>}
        </button>
      ))}
    </div>
  );
}
