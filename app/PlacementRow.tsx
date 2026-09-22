'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ConfidencePicker } from './ConfidencePicker';
import { LogReview } from './LogReview';
import { SolvedCheckbox } from './SolvedCheckbox';

// One roadmap row: the solved checkbox, the problem's content (`children`), fixed-width badge
// columns (`meta`) so they line up down the page, and the 1-5 rating. A solved row always shows
// the 1-5 control (the current rating highlighted, none if it hasn't been rated), so rating is
// one click and there is no separate "unrated" state to see.
export function PlacementRow({
  problemId,
  stageId,
  isSolved,
  confidence,
  meta,
  children,
}: {
  problemId: string;
  stageId: string;
  isSolved: boolean;
  confidence: number | null;
  meta: ReactNode;
  children: ReactNode;
}) {
  // Show the control the moment the box is ticked, without waiting for the server round trip.
  const [solved, setSolved] = useState(isSolved);
  useEffect(() => setSolved(isSolved), [isSolved]);

  return (
    <li className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:flex-nowrap sm:px-5">
      <SolvedCheckbox problemId={problemId} stageId={stageId} isSolved={isSolved} onToggle={setSolved} />
      <div className={cn('min-w-0 flex-1', isSolved && 'text-muted-foreground')}>{children}</div>
      <div className="flex basis-full items-center gap-2 pl-7 sm:basis-auto sm:pl-0">
        {meta}
        <LogReview problemId={problemId} stageId={stageId} />
        <div className="ml-auto flex justify-end sm:ml-0 sm:w-[8.75rem]">
          {solved && <ConfidencePicker problemId={problemId} current={isSolved ? confidence : null} />}
        </div>
      </div>
    </li>
  );
}
