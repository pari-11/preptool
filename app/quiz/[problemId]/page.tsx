import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Lightbulb } from 'lucide-react';
import { QUICK_QUIZ_SIZE, getQuizProblem } from '@/lib/quiz';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { dateStyle: 'medium' });

// Spec 011 F2: the first screen of a problem's quiz asks which approach you used. Each approach
// is a card; "View solution" under the name is there for when you don't know which is yours.
export default async function ProblemQuizPage({ params }: { params: { problemId: string } }) {
  const problem = await getQuizProblem(params.problemId);
  if (!problem || problem.approaches.length === 0) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <Link
        href="/quiz"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Quiz
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {problem.leetcodeId !== null && <span>LC {problem.leetcodeId}</span>}
          <Link href={`/problems/${problem.id}`} className="underline-offset-2 hover:text-foreground hover:underline">
            Problem page
          </Link>
          {problem.neetcodeLink && (
            <a
              href={problem.neetcodeLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
            >
              <Lightbulb className="size-3.5" /> NeetCode solution
            </a>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Which approach did you use? The questions follow that approach.</p>
      </header>

      <ul className="flex flex-col gap-3">
        {problem.approaches.map((a) => {
          const quick = Math.min(QUICK_QUIZ_SIZE, a.questionCount);
          return (
            <li key={a.id}>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {a.name}
                    {a.isUserApproach && (
                      <Badge variant="outline" className="text-[11px]">
                        Your solution
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {a.questionCount} questions
                    {a.lastAttempt && (
                      <>
                        {' '}
                        · last {a.lastAttempt.correct}/{a.lastAttempt.total} on {formatDate(a.lastAttempt.at)}
                      </>
                    )}
                    {a.solutionLink && (
                      <>
                        {' · '}
                        <a
                          href={a.solutionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                        >
                          View solution <ExternalLink className="size-3" />
                        </a>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  {a.questionCount > 0 ? (
                    <>
                      <Link href={`/quiz/${problem.id}/${a.id}?n=${quick}`} className={buttonVariants({ size: 'lg' })}>
                        Quick quiz ({quick})
                      </Link>
                      {a.questionCount > quick && (
                        <Link
                          href={`/quiz/${problem.id}/${a.id}?n=all`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                        >
                          All {a.questionCount}
                        </Link>
                      )}
                      <Link
                        href={`/quiz/${problem.id}/${a.id}/review`}
                        className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        Review the questions
                      </Link>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No questions for this approach yet.</span>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
