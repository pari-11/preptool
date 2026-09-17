import { prisma } from '@/lib/prisma';
import { SolvedCheckbox } from './SolvedCheckbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Lock } from 'lucide-react';

const DIFFICULTY_VARIANT = {
  Easy: 'outline',
  Medium: 'secondary',
  Hard: 'destructive',
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">DSA Roadmap</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {solvedCount} / {seenProblemIds.size} solved
      </p>

      <div className="flex flex-col gap-4">
        {stages.map((stage) => (
          <Card key={stage.id} className={stage.is_bridge ? 'border-violet-300 bg-violet-50 dark:bg-violet-950/20' : undefined}>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="font-bold">{stage.stage_label}</span> — {stage.title}
              </CardTitle>
              {stage.insight_note && (
                <p className="text-sm italic text-muted-foreground">{stage.insight_note}</p>
              )}
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {stage.problems.map((placement) => {
                  const problem = placement.problem;
                  return (
                    <li
                      key={placement.problem_id + placement.stage_id}
                      className="flex flex-wrap items-center gap-2 border-t pt-2 first:border-t-0 first:pt-0"
                    >
                      <SolvedCheckbox problemId={problem.id} isSolved={problem.is_solved} />

                      {problem.source_link ? (
                        <a
                          href={problem.source_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium underline-offset-2 hover:underline"
                        >
                          {problem.title}
                        </a>
                      ) : (
                        <span className="text-sm font-medium">{problem.title}</span>
                      )}

                      {problem.difficulty ? (
                        <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>{problem.difficulty}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-dashed">
                          Unknown
                        </Badge>
                      )}

                      {placement.tier && <Badge variant="secondary">{placement.tier}</Badge>}

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
        ))}
      </div>
    </main>
  );
}
