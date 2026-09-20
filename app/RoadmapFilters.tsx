'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ChevronDown, ListFilter, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CONFIDENCE_LEVELS } from '@/lib/confidence';
import { cn } from '@/lib/utils';
import { DIFFICULTIES, filtersHref, isFiltering, toggleIn, type RoadmapFilters, type StatusFilter } from '@/lib/roadmapFilters';
import { tagStyle, type TagInfo } from '@/lib/tags';
import { useOpenManageTags } from './TagsProvider';

const DIFFICULTY_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' } as const;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unsolved', label: 'Unsolved' },
  { value: 'solved', label: 'Solved' },
];

const CHIP = 'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium transition-colors';
const CHIP_ON = 'border-primary bg-primary text-primary-foreground';
const CHIP_OFF = 'bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground';

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

// One quiet line: a "Filter by" button. It opens a small popover with the options (solved status,
// difficulty, 1-5 rating, tags). Each option is a link that flips its value in the URL, so the
// server renders the filtered roadmap and the popover stays open for the next pick. Within one
// section several picks are OR'd; the sections themselves are AND'd.
export function RoadmapFiltersPanel({
  filters,
  tags,
  matchCount,
  stageCount,
}: {
  filters: RoadmapFilters;
  tags: TagInfo[];
  matchCount: number;
  stageCount: number;
}) {
  const openManage = useOpenManageTags();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const filtering = isFiltering(filters);
  const activeCount =
    (filters.status !== 'all' ? 1 : 0) + filters.difficulty.length + filters.rating.length + filters.tag.length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:border-primary/50 data-popup-open:border-primary',
            filtering && 'border-primary/60'
          )}
        >
          <ListFilter className="size-4 text-muted-foreground" />
          Filter by
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
              {activeCount}
            </span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[21rem] max-w-[calc(100vw-2rem)] p-4"
          initialFocus={(openType) => openType === 'keyboard'}
        >
          <div className="flex flex-col gap-4">
            <Section label="Status">
              <div className="inline-flex rounded-full border bg-muted/60 p-0.5" role="group" aria-label="Solved status">
                {STATUS_OPTIONS.map((option) => {
                  const active = filters.status === option.value;
                  return (
                    <Link
                      key={option.value}
                      href={filtersHref({ ...filters, status: option.value })}
                      scroll={false}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'inline-flex h-6 items-center rounded-full px-3 text-[13px] font-medium transition-colors',
                        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </Section>

            <Section label="Difficulty">
              {DIFFICULTIES.map((name) => {
                const active = filters.difficulty.includes(name);
                return (
                  <Link
                    key={name}
                    href={filtersHref({ ...filters, difficulty: toggleIn(filters.difficulty, name) })}
                    scroll={false}
                    aria-pressed={active}
                    className={cn(CHIP, active ? CHIP_ON : CHIP_OFF)}
                  >
                    <span className={cn('size-2 rounded-full', active ? 'bg-primary-foreground' : DIFFICULTY_DOT[name])} />
                    {name}
                  </Link>
                );
              })}
            </Section>

            <Section label="Rating">
              {CONFIDENCE_LEVELS.map((level) => {
                const active = filters.rating.includes(level.value);
                return (
                  <Link
                    key={level.value}
                    href={filtersHref({ ...filters, rating: toggleIn(filters.rating, level.value) })}
                    scroll={false}
                    aria-pressed={active}
                    title={`${level.value} — ${level.label}`}
                    className={cn(CHIP, 'w-8 justify-center px-0 tabular-nums', active ? CHIP_ON : CHIP_OFF)}
                  >
                    {level.value}
                  </Link>
                );
              })}
            </Section>

            <Section label="Tags">
              {tags.map((tag) => {
                const active = filters.tag.includes(tag.id);
                return (
                  <Link
                    key={tag.id}
                    href={filtersHref({ ...filters, tag: toggleIn(filters.tag, tag.id) })}
                    scroll={false}
                    aria-pressed={active}
                    className={cn(CHIP, active ? CHIP_ON : CHIP_OFF)}
                  >
                    <span className={cn('size-2 rounded-full', active ? 'bg-primary-foreground' : tagStyle(tag.color).dot)} />
                    {tag.name}
                    <span className={cn('text-xs tabular-nums', active ? 'opacity-80' : 'opacity-70')}>{tag.count}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  openManage();
                }}
                className={cn(CHIP, 'border-dashed text-muted-foreground hover:border-primary hover:text-primary')}
              >
                <Plus className="size-3.5" />
                New tag
              </button>
            </Section>

            {filtering && (
              <div className="border-t pt-3 text-right">
                <Link href="/" scroll={false} className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {filtering && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{matchCount}</span>{' '}
          {matchCount === 1 ? 'problem' : 'problems'} in{' '}
          <span className="font-medium text-foreground">{stageCount}</span> {stageCount === 1 ? 'stage' : 'stages'}
          <span aria-hidden> · </span>
          <Link href="/" scroll={false} className="font-medium text-primary underline-offset-2 hover:underline">
            Clear
          </Link>
        </p>
      )}
    </div>
  );
}
