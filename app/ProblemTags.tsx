'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Plus, Settings2, Tag as TagIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { tagStyle, type TagInfo } from '@/lib/tags';
import { setProblemTag } from './actions';
import { NewTagForm } from './NewTagForm';
import { useOpenManageTags, useTags } from './TagsProvider';

export function TagChip({ tag, className }: { tag: Pick<TagInfo, 'name' | 'color'>; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-[7rem] shrink-0 items-center rounded-md px-1.5 text-[11px] font-medium ring-1 ring-inset',
        tagStyle(tag.color).chip,
        className
      )}
    >
      <span className="truncate">{tag.name}</span>
    </span>
  );
}

// A problem's tags as chips, plus the popover to switch tags on and off or create a new one.
// "row" is the compact roadmap version (a few chips, trigger appears on row hover); "full" shows
// every chip with a visible "Add tag" button.
export function ProblemTags({
  problemId,
  appliedIds,
  variant = 'row',
  maxChips = 3,
}: {
  problemId: string;
  appliedIds: string[];
  variant?: 'row' | 'full';
  maxChips?: number;
}) {
  const tags = useTags();
  const openManage = useOpenManageTags();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [applied, setApplied] = useState(() => new Set(appliedIds));
  const [, startTransition] = useTransition();

  // Follow the saved value once the server has re-rendered.
  const savedKey = appliedIds.join(',');
  useEffect(() => {
    setApplied(new Set(appliedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const appliedTags = tags.filter((t) => applied.has(t.id));
  const shown = variant === 'full' ? appliedTags : appliedTags.slice(0, maxChips);
  const hidden = appliedTags.length - shown.length;

  function setTag(tag: TagInfo, on: boolean) {
    setApplied((prev) => {
      const next = new Set(prev);
      if (on) next.add(tag.id);
      else next.delete(tag.id);
      return next;
    });
    startTransition(() => {
      setProblemTag(problemId, tag.id, on);
    });
  }

  return (
    <>
      {shown.map((tag) => (
        <TagChip key={tag.id} tag={tag} />
      ))}
      {hidden > 0 && (
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground" title={appliedTags.map((t) => t.name).join(', ')}>
          +{hidden}
        </span>
      )}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          aria-label="Edit tags"
          title="Tags"
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-md text-muted-foreground/70 transition-colors hover:text-primary data-popup-open:text-primary',
            variant === 'full'
              ? 'h-7 border bg-background px-2.5 text-sm font-medium hover:border-primary'
              : 'size-5 justify-center'
          )}
        >
          {variant === 'full' ? <Plus className="size-3.5" /> : <TagIcon className="size-3.5" />}
          {variant === 'full' && 'Add tag'}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1.5">
          <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
            {tags.map((tag) => {
              const on = applied.has(tag.id);
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setTag(tag, !on)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', tagStyle(tag.color).dot)} />
                    <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1.5 border-t px-0.5 pt-2">
            <NewTagForm
              applyToProblemId={problemId}
              onCreated={(tag) => setApplied((prev) => new Set(prev).add(tag.id))}
            />
            <button
              type="button"
              onClick={() => {
                setPopoverOpen(false);
                openManage();
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings2 className="size-3.5" />
              Manage tags
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
