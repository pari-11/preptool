'use client';

import { useEffect, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { tagStyle, type TagInfo } from '@/lib/tags';
import { deleteTag } from './actions';
import { NewTagForm } from './NewTagForm';

// "Manage tags": add tags and delete any of them (the pre-added ones too). Deleting asks first,
// inline in the row, and removes the tag from every problem. The list follows the server after each
// change, but adds and deletes also show up instantly from local state.
export function ManageTagsDialog({
  tags,
  open,
  onOpenChange,
}: {
  tags: TagInfo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [list, setList] = useState<TagInfo[]>(tags);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const serverKey = tags.map((t) => `${t.id}:${t.name}:${t.count}`).join('|');
  useEffect(() => {
    setList(tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => {
    if (!open) setConfirmId(null);
  }, [open]);

  function remove(tag: TagInfo) {
    setList((prev) => prev.filter((t) => t.id !== tag.id));
    setConfirmId(null);
    startTransition(() => {
      deleteTag(tag.id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent className="gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle>Manage tags</DialogTitle>
          <DialogDescription>
            Add your own tags, or delete the ones you don&apos;t want. Deleting a tag removes it from every problem.
          </DialogDescription>
        </div>

        <NewTagForm
          applyToProblemId={null}
          autoFocus
          onCreated={(tag) =>
            setList((prev) =>
              prev.some((t) => t.id === tag.id) ? prev : [...prev, { ...tag, isPreset: false, count: 0 }]
            )
          }
        />

        <ul className="scroll-thin -mx-2 flex max-h-72 flex-col gap-0.5 overflow-y-auto px-2" aria-label="All tags">
          {list.length === 0 && (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No tags yet. Add your first one above.
            </li>
          )}
          {list.map((tag) => {
            const confirming = confirmId === tag.id;
            return (
              <li
                key={tag.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                  confirming ? 'bg-destructive/10' : 'hover:bg-muted/60'
                )}
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', tagStyle(tag.color).dot)} />
                {confirming ? (
                  <>
                    <span className="min-w-0 flex-1 leading-snug">
                      Delete <span className="font-medium">{tag.name}</span>?
                      {tag.count > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          Removed from {tag.count} {tag.count === 1 ? 'problem' : 'problems'}.
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(tag)}
                      className="h-7 shrink-0 rounded-md bg-destructive px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="h-7 shrink-0 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {tag.count} {tag.count === 1 ? 'problem' : 'problems'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmId(tag.id)}
                      aria-label={`Delete tag ${tag.name}`}
                      title="Delete this tag"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end">
          <DialogClose className="h-8 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Done
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
