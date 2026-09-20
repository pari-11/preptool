import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isFiltering, parseFilters, placementMatches } from '@/lib/roadmapFilters';
import type { TagInfo } from '@/lib/tags';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { RoadmapFiltersPanel } from './RoadmapFilters';
import { RoadmapNav, type NavItem } from './RoadmapNav';
import { RoadmapShell } from './RoadmapShell';
import { TagsProvider } from './TagsProvider';
import {
  GroupCard,
  StageCard,
  stageCounts,
  stageInclude,
  subTitle,
  type StageProblems,
  type StageRow,
} from './StageSection';

type Group = NonNullable<StageRow['group']>;
type Entry = { stage: StageRow; index: number; shown: StageProblems };
type Block = ({ kind: 'stage' } & Entry) | { kind: 'group'; group: Group; stages: Entry[] };

const DIFFICULTIES = [
  { key: 'Easy', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'Medium', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'Hard', bar: 'bg-rose-500', dot: 'bg-rose-500' },
] as const;

function StatTile({
  label,
  solved,
  total,
  barClassName,
  dotClassName,
}: {
  label: string;
  solved: number;
  total: number;
  barClassName?: string;
  dotClassName?: string;
}) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {dotClassName && <span className={cn('size-2 rounded-full', dotClassName)} />}
          {label}
        </span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{solved}</span>
        <span className="text-sm tabular-nums text-muted-foreground">/ {total}</span>
      </div>
      <ProgressBar value={pct} label={`${label}: ${solved} of ${total} solved`} className="mt-3" barClassName={barClassName} />
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [stages, tagRows] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' }, include: stageInclude }),
    prisma.tag.findMany({
      orderBy: [{ is_preset: 'desc' }, { created_at: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { problems: true } } },
    }),
  ]);

  const tags: TagInfo[] = tagRows.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    isPreset: t.is_preset,
    count: t._count.problems,
  }));
  const collapsed = cookies().get('roadmap-nav')?.value === 'collapsed';

  // Filters come from the URL. Tag ids that no longer exist (a deleted tag in an old link) are ignored.
  const parsed = parseFilters(searchParams);
  const knownTagIds = new Set(tagRows.map((t) => t.id));
  const filters = { ...parsed, tag: parsed.tag.filter((id) => knownTagIds.has(id)) };
  const filtering = isFiltering(filters);

  // Each stage keeps its position number (`index`) so anchors are stable; `shown` is the rows that
  // pass the filters. Stages with nothing to show drop out; counters still use the whole stage.
  const entries: Entry[] = stages
    .map((stage, index) => ({
      stage,
      index,
      shown: filtering ? stage.problems.filter((p) => placementMatches(p, filters)) : stage.problems,
    }))
    .filter((entry) => entry.shown.length > 0);
  const matchCount = new Set(entries.flatMap((e) => e.shown.map((p) => p.problem_id))).size;

  // Stages sharing a group collapse into one block, placed where the group's first stage sits.
  const blocks: Block[] = [];
  const groupBlocks = new Map<string, Extract<Block, { kind: 'group' }>>();
  for (const entry of entries) {
    if (!entry.stage.group) {
      blocks.push({ kind: 'stage', ...entry });
      continue;
    }
    let block = groupBlocks.get(entry.stage.group.id);
    if (!block) {
      block = { kind: 'group', group: entry.stage.group, stages: [] };
      groupBlocks.set(entry.stage.group.id, block);
      blocks.push(block);
    }
    block.stages.push(entry);
  }

  // Headline numbers count each problem once, even if it sits in two stages (LC 268).
  const problems = new Map<string, StageRow['problems'][number]['problem']>();
  for (const stage of stages) {
    for (const placement of stage.problems) problems.set(placement.problem.id, placement.problem);
  }
  const totalCount = problems.size;
  const solvedCount = [...problems.values()].filter((p) => p.is_solved).length;
  const byDifficulty = DIFFICULTIES.map((d) => {
    const inTier = [...problems.values()].filter((p) => p.difficulty === d.key);
    return { ...d, solved: inTier.filter((p) => p.is_solved).length, total: inTier.length };
  });

  const navItems: NavItem[] = blocks.map((block) => {
    if (block.kind === 'stage') {
      return {
        type: 'stage',
        anchor: `stage-${block.index}`,
        label: block.stage.stage_label,
        title: block.stage.title,
      };
    }
    const counts = block.stages.map(({ stage }) => stageCounts(stage));
    return {
      type: 'group',
      anchor: `group-${block.group.id}`,
      title: block.group.title,
      solved: counts.reduce((sum, c) => sum + c.solved, 0),
      total: counts.reduce((sum, c) => sum + c.total, 0),
      children: block.stages.map(({ stage, index }) => ({
        anchor: `stage-${index}`,
        label: stage.stage_label.replace(/^Stage\s+/, ''),
        title: subTitle(stage),
      })),
    };
  });

  return (
    <TagsProvider tags={tags}>
      <RoadmapShell nav={<RoadmapNav items={navItems} />} initialCollapsed={collapsed}>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">DSA Roadmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stages.length} stages · {totalCount} problems. Tick a problem when you solve it, then rate how it went.
          </p>
        </header>

        <section aria-label="Progress" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Solved" solved={solvedCount} total={totalCount} />
          {byDifficulty.map((d) => (
            <StatTile
              key={d.key}
              label={d.key}
              solved={d.solved}
              total={d.total}
              barClassName={d.bar}
              dotClassName={d.dot}
            />
          ))}
        </section>

        <div className="mb-5">
          <RoadmapFiltersPanel
            filters={filters}
            tags={tags}
            matchCount={matchCount}
            stageCount={entries.length}
          />
        </div>

        {blocks.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No problems match these filters.{' '}
            <Link href="/" scroll={false} className="font-medium text-primary underline-offset-2 hover:underline">
              Clear all filters
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {blocks.map((block) =>
            block.kind === 'stage' ? (
              <StageCard key={block.stage.id} stage={block.stage} index={block.index} problems={block.shown} />
            ) : (
              <GroupCard key={block.group.id} group={block.group} stages={block.stages} />
            )
          )}
        </div>
      </RoadmapShell>
    </TagsProvider>
  );
}
