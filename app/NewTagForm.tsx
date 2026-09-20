'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { CUSTOM_TAG_COLOR_ORDER, MAX_TAG_NAME_LENGTH } from '@/lib/tags';
import { createTag, type CreatedTag } from './actions';
import { TagColorSwatches } from './TagColorSwatches';
import { useTags } from './TagsProvider';

// The "new tag" input shared by the Manage tags dialog and the row picker. As soon as something is
// typed, the colours appear underneath (the next one in the usual rotation is pre-selected) and
// the chosen colour is saved with the tag. With a problem id the new tag is also put on that problem.
export function NewTagForm({
  applyToProblemId,
  onCreated,
  autoFocus = false,
}: {
  applyToProblemId: string | null;
  onCreated?: (tag: CreatedTag) => void;
  autoFocus?: boolean;
}) {
  const tags = useTags();
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Until a colour is clicked, suggest the one the server would pick next.
  const suggested = CUSTOM_TAG_COLOR_ORDER[tags.filter((t) => !t.isPreset).length % CUSTOM_TAG_COLOR_ORDER.length];
  const color = picked ?? suggested;
  const typing = name.trim() !== '';

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!typing) return;
        startTransition(async () => {
          const result = await createTag(name, applyToProblemId, color);
          if (result.ok) {
            setName('');
            setPicked(null);
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
          disabled={isPending || !typing}
          aria-label="Add tag"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {typing && <TagColorSwatches value={color} onChange={setPicked} label="Colour for the new tag" />}
      {error && <p className="px-0.5 text-xs text-destructive">{error}</p>}
    </form>
  );
}
