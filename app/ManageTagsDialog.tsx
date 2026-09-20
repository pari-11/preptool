'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MAX_TAG_NAME_LENGTH, tagStyle, type TagInfo } from '@/lib/tags';
import { deleteTag, updateTag } from './actions';
import { NewTagForm } from './NewTagForm';
import { TagColorSwatches } from './TagColorSwatches';

// "Manage tags": add tags (the colours show up as soon as you type), edit a tag's name and colour
// (pencil in front of the row), and delete any of them, the pre-added ones too. Deleting asks first,
// inline, and removes the tag from every problem. The list follows the server after each change,
// but adds, edits and deletes also show up instantly from local state.
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
  const [editId, setEditId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [, startTransition] = useTransition();

  const serverKey = tags.map((t) => `${t.id}:${t.name}:${t.color}:${t.count}`).join('|');
  useEffect(() => {
    setList(tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => {
    if (!open) {
      setConfirmId(null);
      setEditId(null);
    }
  }, [open]);

  function startEdit(tag: TagInfo) {
    setEditId(tag.id);
    setDraftName(tag.name);
    setDraftColor(tag.color);
    setEditError(null);
    setConfirmId(null);
  }

  function saveEdit(tag: TagInfo) {
    if (draftName.trim() === tag.name && draftColor === tag.color) {
      setEditId(null);
      return;
    }
    startSaving(async () => {
      const result = await updateTag(tag.id, draftName, draftColor);
      if (result.ok) {
        setList((prev) =>
          prev.map((t) => (t.id === tag.id ? { ...t, name: result.tag.name, color: result.tag.color } : t))
        );
        setEditId(null);
      } else {
        setEditError(result.error);
      }
    });
  }

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
            Add your own tags, rename them or change their colours, or delete the ones you don&apos;t want. Deleting a
            tag removes it from every problem.
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
            const editing = editId === tag.id;
            return (
              <li
                key={tag.id}
                className={cn(
                  'flex flex-col rounded-lg px-2 py-1.5 text-sm transition-colors',
                  confirming ? 'bg-destructive/10' : editing ? 'bg-muted/60' : 'hover:bg-muted/60'
                )}
              >
                {editing ? (
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(tag);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center">
                        <span className={cn('size-3 rounded-full', tagStyle(draftColor).dot)} />
                      </span>
                      <input
                        value={draftName}
                        onChange={(e) => {
                          setDraftName(e.target.value);
                          setEditError(null);
                        }}
                        maxLength={MAX_TAG_NAME_LENGTH}
                        aria-label={`Name of ${tag.name}`}
                        autoFocus
                        className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      <button
                        type="submit"
                        disabled={saving || draftName.trim() === ''}
                        aria-label="Save changes"
                        title="Save"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        aria-label="Cancel editing"
                        title="Cancel"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <TagColorSwatches
                      className="pl-9"
                      value={draftColor}
                      onChange={setDraftColor}
                      label={`Colour for ${tag.name}`}
                    />
                    {editError && <p className="pl-9 text-xs text-destructive">{editError}</p>}
                  </form>
                ) : confirming ? (
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center">
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
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(tag)}
                      aria-label={`Edit tag ${tag.name}`}
                      title="Edit name and colour"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <span className={cn('size-2.5 shrink-0 rounded-full', tagStyle(tag.color).dot)} />
                    <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {tag.count} {tag.count === 1 ? 'problem' : 'problems'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(tag.id);
                        setEditId(null);
                      }}
                      aria-label={`Delete tag ${tag.name}`}
                      title="Delete this tag"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
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
