'use client';

import { useTransition } from 'react';
import { BookOpen, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logReview } from './actions';

// Two lightweight review events, distinct from a solve: 'Revised' (re-read the solution/notes,
// no fresh solve) and 'Revisited' (just looked at it again). Neither drives a placement's
// checkbox, so no stage picker is needed — stageId is passed through for context when the caller
// has one (a roadmap row knows its own stage) and is simply null from the review queue.
export function LogReview({ problemId, stageId }: { problemId: string; stageId: string | null }) {
  const [pending, startTransition] = useTransition();

  function log(kind: 'Revised' | 'Revisited') {
    startTransition(() => {
      logReview(problemId, stageId, kind);
    });
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Log a review">
      <button
        type="button"
        disabled={pending}
        title="Log a revisit — just looked at it again"
        aria-label="Log a revisit"
        onClick={() => log('Revisited')}
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50'
        )}
      >
        <Eye className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={pending}
        title="Log a revision — re-read the solution or notes"
        aria-label="Log a revision"
        onClick={() => log('Revised')}
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50'
        )}
      >
        <BookOpen className="size-3.5" />
      </button>
    </div>
  );
}
