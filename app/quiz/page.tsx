import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { listQuizProblems } from '@/lib/quiz';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { dateStyle: 'medium' });

export default async function QuizPage() {
  const problems = await listQuizProblems();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Quiz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check that you understand the approach you used, not just that it was accepted. Open any problem's quiz here,
          or from its page, or right after you tick it solved.
        </p>
      </header>

      {problems.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-6 text-sm text-muted-foreground">No quizzes yet.</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {problems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/quiz/${p.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.leetcodeId !== null && <>LC {p.leetcodeId} · </>}
                    {p.approachCount} {p.approachCount === 1 ? 'approach' : 'approaches'} · {p.questionCount} questions
                    {p.lastAttempt && (
                      <>
                        {' '}
                        · last {p.lastAttempt.correct}/{p.lastAttempt.total} on {formatDate(p.lastAttempt.at)}
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
