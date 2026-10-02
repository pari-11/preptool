'use client';

import Link from 'next/link';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { buttonVariants } from '@/components/ui/button';

// Spec 011 F1/F5: shown right after a problem that has a quiz is ticked solved. Never blocks the
// tick (that has already been saved by the time this is up) and closes in one click.
export function QuizPromptDialog({
  problemId,
  title,
  onClose,
}: {
  problemId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle>Quiz yourself on {title}?</DialogTitle>
          <DialogDescription>
            Pick the approach you used and answer a few questions to check you understand it, not just that it passed.
          </DialogDescription>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DialogClose className={buttonVariants({ variant: 'ghost', size: 'lg' })}>Not now</DialogClose>
          <Link href={`/quiz/${problemId}`} onClick={onClose} className={buttonVariants({ size: 'lg' })}>
            Start quiz
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
