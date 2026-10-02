'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

// The user's code with line numbers, and amber highlighting on `litLines` (0-based). Shared by the
// quiz (beside the question) and the review page (beside the question list). The panel scrolls on
// its own, and whenever `scrollKey` changes the first highlighted line is brought into view inside
// the panel (never the whole page).
export function CodePanel({
  code,
  litLines,
  scrollKey,
  className,
}: {
  code: string;
  litLines: number[];
  scrollKey: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);
  const lit = useMemo(() => new Set(litLines), [litLines]);

  useEffect(() => {
    const box = boxRef.current;
    const first = box?.querySelector<HTMLElement>('[data-lit="true"]');
    if (!box || !first) return;
    box.scrollTo({ top: Math.max(0, first.offsetTop - box.clientHeight / 3), behavior: 'smooth' });
    // Only when the key changes: a re-render with the same highlight must not yank the scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  return (
    <div
      ref={boxRef}
      className={cn(
        // pb-12: room to scroll past the last line instead of it sitting flush at the edge
        'relative overflow-auto rounded-lg border bg-muted/50 pb-12 pt-2 font-mono text-[13px] leading-relaxed',
        className
      )}
    >
      <div className="w-max min-w-full">
        {lines.map((line, i) => (
          <div
            key={i}
            data-lit={lit.has(i) ? 'true' : undefined}
            className={cn('flex border-l-2 pr-3', lit.has(i) ? 'border-amber-500 bg-amber-500/20' : 'border-transparent')}
          >
            <span className="w-9 shrink-0 select-none pr-3 text-right text-muted-foreground/70">{i + 1}</span>
            <code className="whitespace-pre">{line || ' '}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
