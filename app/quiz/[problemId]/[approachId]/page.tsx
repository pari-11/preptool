import { notFound } from 'next/navigation';
import { QUICK_QUIZ_SIZE, getQuizRun } from '@/lib/quiz';
import { QuizPlayer } from '@/app/quiz/QuizPlayer';

// Rendered per request so every visit (and every "Try again") reshuffles the options and, for a
// quick quiz, re-samples the questions.
export const dynamic = 'force-dynamic';

export default async function QuizRunPage({
  params,
  searchParams,
}: {
  params: { problemId: string; approachId: string };
  searchParams: { n?: string };
}) {
  const n = searchParams.n === 'all' ? null : Number.parseInt(searchParams.n ?? '', 10);
  const limit = n === null ? null : Number.isFinite(n) && n > 0 ? n : QUICK_QUIZ_SIZE;

  const run = await getQuizRun(params.approachId, limit);
  if (!run || run.problemId !== params.problemId || run.questions.length === 0) notFound();

  return (
    <QuizPlayer
      approachId={run.approachId}
      approachName={run.approachName}
      problemId={run.problemId}
      problemTitle={run.problemTitle}
      solutionCode={run.solutionCode}
      questions={run.questions}
      retryHref={`/quiz/${run.problemId}/${run.approachId}?n=${limit === null ? 'all' : limit}`}
    />
  );
}
