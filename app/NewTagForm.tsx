'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { MAX_TAG_NAME_LENGTH } from '@/lib/tags';
import { createTag, type CreatedTag } from './actions';

// The "+ new tag" input shared by the row picker and the filter bar. With a problem id the new
// tag is also put on that problem.
export function NewTagForm({
  applyToProblemId,
  onCreated,
  autoFocus = false,
}: {
  applyToProblemId: string | null;
  onCreated?: (tag: CreatedTag) => void;
  autoFocus?: boolean;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() === '') return;
        startTransition(async () => {
          const result = await createTag(name, applyToProblemId);
          if (result.ok) {
            setName('');
            setError(null);
            onCreated?.(result.tag);
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <div className="flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={MAX_TAG_NAME_LENGTH}
          placeholder="New tag…"
          aria-label="New tag name"
          autoFocus={autoFocus}
          className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={isPending || name.trim() === ''}
          aria-label="Add tag"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {error && <p className="px-0.5 text-xs text-destructive">{error}</p>}
    </form>
  );
}
