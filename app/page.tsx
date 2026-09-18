import { prisma } from '@/lib/prisma';
import { SolvedCheckbox } from './SolvedCheckbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIFFICULTY_STYLES = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400',
  Hard: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400',
} as const;

const TIER_STYLES = {
  Core: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400',
  Supp: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  Stretch: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-400',
} as const;

export default async function Home() {
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    include: {
      problems: {
        orderBy: { roadmap_order: 'asc' },
        include: { problem: true },
      },
    },
  });

  const seenProblemIds = new Set<string>();
  let solvedCount = 0;
  for (const stage of stages) {
    for (const placement of stage.problems) {
      if (!seenProblemIds.has(placement.problem.id)) {
        seenProblemIds.add(placement.problem.id);
        if (placement.problem.is_solved) solvedCount++;
      }
    }
  }
  const totalCount = seenProblemIds.size;
  const percent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-10">
        <aside className="sticky top-10 hidden h-fit max-h-[calc(100vh-5rem)] w-36 shrink-0 overflow-y-auto md:block">
          <nav className="flex flex-col gap-0.5 text-sm">
            {stages.map((stage, index) => (
              <a
                key={stage.id}
                href={`#stage-${index}`}
                className="truncate rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`${stage.stage_label} — ${stage.title}`}
              >
                {stage.stage_label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">DSA Roadmap</h1>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={percent} className="h-2 max-w-xs" />
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {solvedCount} / {totalCount} solved ({percent}%)
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-5">
            {stages.map((stage, index) => {
              const stageSolved = stage.problems.filter((p) => p.problem.is_solved).length;
              const stageTotal = stage.problems.length;

              return (
                <Card
                  key={stage.id}
                  id={`stage-${index}`}
                  className={cn(
                    'scroll-mt-10 shadow-sm',
                    stage.is_bridge && 'border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-base">
                        <span className="font-bold">{stage.stage_label}</span>
                        <span className="text-muted-foreground"> — {stage.title}</span>
                      </CardTitle>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {stageSolved}/{stageTotal}
                      </span>
                    </div>
                    {stage.insight_note && (
                      <p className="text-sm italic text-muted-foreground/80">{stage.insight_note}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2.5">
                      {stage.problems.map((placement) => {
                        const problem = placement.problem;
                        return (
                          <li
                            key={placement.problem_id + placement.stage_id}
                            className="flex flex-wrap items-center gap-2 border-t pt-2.5 first:border-t-0 first:pt-0"
                          >
                            <SolvedCheckbox problemId={problem.id} isSolved={problem.is_solved} />

                            {problem.source_link ? (
                              <a
                                href={problem.source_link}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  'text-sm font-medium underline-offset-2 hover:underline',
                                  problem.is_solved && 'text-muted-foreground line-through decoration-muted-foreground/50'
                                )}
                              >
                                {problem.title}
                              </a>
                            ) : (
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  problem.is_solved && 'text-muted-foreground line-through'
                                )}
                              >
                                {problem.title}
                              </span>
                            )}

                            {problem.difficulty ? (
                              <Badge variant="outline" className={DIFFICULTY_STYLES[problem.difficulty]}>
                                {problem.difficulty}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-dashed text-muted-foreground">
                                Unknown
                              </Badge>
                            )}

                            {placement.tier && (
                              <Badge variant="outline" className={TIER_STYLES[placement.tier]}>
                                {placement.tier}
                              </Badge>
                            )}

                            {placement.is_priority && (
                              <span className="text-amber-500" title="Priority">
                                ★
                              </span>
                            )}

                            {problem.is_premium && (
                              <Lock className="size-3.5 text-muted-foreground" aria-label="LeetCode Premium" />
                            )}

                            {problem.note && (
                              <Tooltip>
                                <TooltipTrigger className="inline-flex appearance-none border-0 bg-transparent p-0">
                                  <Info className="size-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>{problem.note}</TooltipContent>
                              </Tooltip>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
