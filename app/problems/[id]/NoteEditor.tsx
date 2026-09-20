'use client';

import { useState, useTransition } from 'react';
import { saveNote } from '@/app/actions';

export function NoteEditor({ problemId, initial }: { problemId: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const dirty = text !== saved;

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Your own words: the insight, what tripped you up, where you've seen this before…"
        className="w-full rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || isPending}
          onClick={() =>
            startTransition(async () => {
              await saveNote(problemId, text);
              setSaved(text.trim());
              setText(text.trim());
            })
          }
          className="rounded-md border bg-primary px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save note'}
        </button>
        {!dirty && saved !== '' && <span className="text-xs text-muted-foreground">Saved</span>}
      </div>
    </div>
  );
}
