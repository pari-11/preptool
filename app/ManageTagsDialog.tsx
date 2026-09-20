'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TAG_COLOR_KEYS, tagStyle, type TagInfo } from '@/lib/tags';
import { deleteTag, setTagColor } from './actions';
import { NewTagForm } from './NewTagForm';

// "Manage tags": add tags, change their colour, and delete any of them (the pre-added ones too).
// Clicking a tag's colour dot opens a palette in the row; deleting asks first, inline, and removes
// the tag from every problem. The list follows the server after each change, but adds, colour
// changes and deletes also show up instantly from local state.
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
  const [colorId, setColorId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const serverKey = tags.map((t) => `${t.id}:${t.name}:${t.color}:${t.count}`).join('|');
  useEffect(() => {
    setList(tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => {
    if (!open) {
      setConfirmId(null);
      setColorId(null);
    }
  }, [open]);

  function remove(tag: TagInfo) {
    setList((prev) => prev.filter((t) => t.id !== tag.id));
    setConfirmId(null);
    startTransition(() => {
      deleteTag(tag.id);
    });
  }

  function recolor(tag: TagInfo, color: string) {
    setList((prev) => prev.map((t) => (t.id === tag.id ? { ...t, color } : t)));
    setColorId(null);
    if (color === tag.color) return;
    startTransition(() => {
      setTagColor(tag.id, color);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent className="gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle>Manage tags</DialogTitle>
          <DialogDescription>
            Add your own tags, change their colours, or delete the ones you don&apos;t want. Deleting a tag removes it
            from every problem.
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
            const picking = colorId === tag.id;
            return (
              <li
                key={tag.id}
                className={cn(
                  'flex flex-col rounded-lg px-2 py-1.5 text-sm transition-colors',
                  confirming ? 'bg-destructive/10' : 'hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2">
                  {confirming ? (
                    <>
                      <span className="flex size-6 shrink-0 items-center justify-center">
                        <span className={cn('size-3 rounded-full', tagStyle(tag.color).dot)} />
                      </span>
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
                      <button
                        type="button"
                        onClick={() => {
                          setColorId(picking ? null : tag.id);
                          setConfirmId(null);
                        }}
                        aria-label={`Change the colour of ${tag.name}`}
                        aria-expanded={picking}
                        title="Change colour"
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted',
                          picking && 'bg-muted'
                        )}
                      >
                        <span className={cn('size-3 rounded-full', tagStyle(tag.color).dot)} />
                      </button>
                      <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {tag.count} {tag.count === 1 ? 'problem' : 'problems'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmId(tag.id);
                          setColorId(null);
                        }}
                        aria-label={`Delete tag ${tag.name}`}
                        title="Delete this tag"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </div>

                {picking && (
                  <div
                    className="flex flex-wrap items-center gap-2 pb-1 pl-8 pt-2"
                    role="group"
                    aria-label={`Colours for ${tag.name}`}
                  >
                    {TAG_COLOR_KEYS.map((key) => {
                      const selected = key === tag.color;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => recolor(tag, key)}
                          aria-label={`Set the colour to ${key}`}
                          aria-pressed={selected}
                          title={key}
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110',
                            tagStyle(key).dot,
                            selected && 'ring-2 ring-foreground/70'
                          )}
                        >
                          {selected && <Check className="size-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
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
