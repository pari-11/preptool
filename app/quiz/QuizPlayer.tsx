'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Code, X } from 'lucide-react';
import type { QuizCategory } from '@prisma/client';
import { categoryLabel } from '@/lib/quizCategories';
import { resolveHighlight, type HighlightSpec } from '@/lib/quizHighlight';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { submitQuizAttempt } from '@/app/actions';
import { CodePanel } from './CodePanel';

type Question = {
  id: string;
  category: QuizCategory;
  text: string;
  snippet: string | null;
  // Already shuffled by the server. `index` is the canonical position that an answer refers to.
  options: { index: number; text: string }[];
  correctIndex: number;
  explanation: string | null;
  highlight: HighlightSpec[] | null;
};

const LETTERS = ['A', 'B', 'C', 'D'];

// One quiz run (spec 011 F3/F4): a question at a time, instant right/wrong with the correct
// option shown, then Next. The run is stored once, when the last question is answered; leaving
// midway stores nothing. Options arrive shuffled, so the correct one is in a random place.
// After answering (right or wrong) the card offers the explanation, and for the user's own
// approach a "View your solution" button splits the screen with their code beside the question,
// and opening the explanation then highlights the lines of that code it is about.
export function QuizPlayer({
  approachId,
  approachName,
  problemId,
  problemTitle,
  solutionCode,
  questions: initialQuestions,
  retryHref,
}: {
  approachId: string;
  approachName: string;
  problemId: string;
  problemTitle: string;
  // The user's own code for this approach, or null (a standard approach links out instead).
  solutionCode: string | null;
  questions: Question[];
  retryHref: string;
}) {
  // Frozen for the life of the run. The page is rendered per request with a fresh sample and
  // shuffle, and saving the attempt makes Next refetch it; props changing mid-run must not swap
  // the questions under the results screen.
  const [questions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  // question id -> canonical option index the user picked
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving');
  const [, startTransition] = useTransition();

  const question = questions[index];
  const picked = question ? chosen[question.id] : undefined;
  const answered = picked !== undefined;
  const isLast = index === questions.length - 1;
  const correctCount = questions.filter((q) => chosen[q.id] === q.correctIndex).length;

  // The code panel only exists in the split view. Lines are highlighted while the explanation is
  // open and cleared when it is hidden or the next question loads (showExplanation resets).
  const split = showCode && solutionCode !== null;
  const litLines = split && showExplanation && question ? resolveHighlight(solutionCode, question.highlight) : [];

  function choose(optionIndex: number) {
    if (answered) return;
    setChosen((c) => ({ ...c, [question.id]: optionIndex }));
  }

  function next() {
    setShowExplanation(false);
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    setFinished(true);
    setSaveState('saving');
    const answers = questions.map((q) => ({ questionId: q.id, chosenIndex: chosen[q.id] }));
    startTransition(() => {
      submitQuizAttempt(approachId, answers).then(
        () => setSaveState('saved'),
        () => setSaveState('error')
      );
    });
  }

  const backHref = `/quiz/${problemId}`;

  if (finished) {
    const missed = questions.filter((q) => chosen[q.id] !== q.correctIndex);
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {correctCount} / {questions.length}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {problemTitle} · {approachName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {saveState === 'saving' && 'Saving this attempt…'}
            {saveState === 'saved' && 'Attempt saved. It does not change your confidence rating.'}
            {saveState === 'error' && "Couldn't save this attempt. Your score above is still right."}
          </p>
        </header>

        {missed.length > 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-4 py-4">
              <h2 className="text-sm font-medium">Missed ({missed.length})</h2>
              <ul className="flex flex-col gap-4">
                {missed.map((q) => (
                  <li key={q.id} className="flex flex-col gap-1.5 border-t pt-3 first:border-t-0 first:pt-0">
                    <Badge variant="outline" className="w-fit text-[11px]">
                      {categoryLabel(q.category)}
                    </Badge>
                    <p className="text-sm">{q.text}</p>
                    {q.snippet && <Snippet code={q.snippet} />}
                    <p className="text-sm">
                      <span className="text-muted-foreground">You picked: </span>
                      {q.options.find((o) => o.index === chosen[q.id])?.text}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      <span className="text-muted-foreground">Correct: </span>
                      {q.options.find((o) => o.index === q.correctIndex)?.text}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="py-4 text-sm">Every answer right.</CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* A plain anchor so the server renders a fresh shuffle/sample rather than a cached page. */}
          <a href={retryHref} className={buttonVariants({ size: 'lg' })}>
            Try again
          </a>
          <Link href={backHref} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Back to approaches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto flex flex-col gap-5 px-4 py-8 sm:px-6', split ? 'max-w-6xl' : 'max-w-2xl')}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {problemTitle}
        </Link>
        <div className="flex items-center gap-3">
          {solutionCode !== null && (
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              aria-pressed={showCode}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
                showCode
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Code className="size-4" />
              {showCode ? 'Hide your solution' : 'View your solution'}
            </button>
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Side by side from the lg breakpoint; below it the question comes first and the code
          underneath. With the code hidden this wrapper holds just the one card. */}
      <div className={cn(split && 'grid items-start gap-5 lg:grid-cols-2')}>
        {split && (
          <Card className="order-2 shadow-sm lg:sticky lg:top-20 lg:order-1">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Your solution</h2>
                <span className="text-xs text-muted-foreground">{approachName}</span>
              </div>
              <CodePanel
                code={solutionCode}
                litLines={litLines}
                scrollKey={`${index}:${showExplanation}`}
                className="max-h-[70vh]"
              />
            </CardContent>
          </Card>
        )}

        <Card className="order-1 shadow-sm lg:order-2">
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[11px]">
                {categoryLabel(question.category)}
              </Badge>
              <span>{approachName}</span>
            </div>

            <p className="text-base font-medium leading-snug">{question.text}</p>
            {question.snippet && <Snippet code={question.snippet} />}

            <ul className="flex flex-col gap-2">
              {question.options.map((option, position) => {
                const isCorrect = option.index === question.correctIndex;
                const isPicked = option.index === picked;
                return (
                  <li key={option.index}>
                    <button
                      type="button"
                      disabled={answered}
                      onClick={() => choose(option.index)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        !answered && 'hover:bg-muted',
                        answered && isCorrect && 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950',
                        answered && isPicked && !isCorrect && 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950',
                        answered && !isCorrect && !isPicked && 'opacity-60'
                      )}
                    >
                      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded border text-[11px] font-medium text-muted-foreground">
                        {LETTERS[position]}
                      </span>
                      <span className="min-w-0 flex-1">{option.text}</span>
                      {answered && isCorrect && <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="Correct" />}
                      {answered && isPicked && !isCorrect && <X className="mt-0.5 size-4 shrink-0 text-rose-600" aria-label="Your answer" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            {answered && (
              <div className="flex flex-col gap-3 border-t pt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      picked === question.correctIndex ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    )}
                  >
                    {picked === question.correctIndex ? 'Correct' : 'Not quite'}
                  </span>
                  <div className="flex items-center gap-2">
                    {question.explanation && (
                      <button
                        type="button"
                        onClick={() => setShowExplanation((v) => !v)}
                        aria-expanded={showExplanation}
                        className={buttonVariants({ variant: 'outline', size: 'lg' })}
                      >
                        {showExplanation ? 'Hide explanation' : 'View explanation'}
                      </button>
                    )}
                    <button type="button" onClick={next} className={buttonVariants({ size: 'lg' })}>
                      {isLast ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </div>
                {showExplanation && question.explanation && (
                  <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed">
                    <span className="mb-0.5 block text-xs font-medium text-muted-foreground">Explanation</span>
                    {question.explanation}
                    {question.highlight && solutionCode !== null && (
                      <span className="mt-1.5 block text-xs text-muted-foreground">
                        {split
                          ? 'The related lines are highlighted in your code.'
                          : 'Open "View your solution" to see the related lines highlighted.'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Snippet({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 px-3 py-2 font-mono text-[13px] leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}
