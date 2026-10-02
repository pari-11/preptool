'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Code, ShieldCheck } from 'lucide-react';
import type { QuizCategory } from '@prisma/client';
import { categoryLabel } from '@/lib/quizCategories';
import { describeLines, resolveHighlight, type HighlightSpec } from '@/lib/quizHighlight';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CodePanel } from '@/app/quiz/CodePanel';

const LETTERS = ['A', 'B', 'C', 'D'];

type Question = {
  id: string;
  category: QuizCategory;
  text: string;
  snippet: string | null;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  highlight: HighlightSpec[] | null;
  verified: boolean;
};

type Chip = { key: QuizCategory; label: string; hint: string; count: number };

// The review page: every stored question for an approach, one pattern at a time if you like. With
// the code panel open the screen splits: the code stays on the left and the questions scroll on
// their own on the right, and clicking a question highlights its lines in the code. Below the lg
// breakpoint they stack, code first, and the page scrolls normally.
export function ReviewWorkspace({
  problemId,
  approachId,
  problemTitle,
  approachName,
  total,
  chips,
  category,
  code,
  questions,
}: {
  problemId: string;
  approachId: string;
  problemTitle: string;
  approachName: string;
  total: number;
  chips: Chip[];
  category: QuizCategory | null;
  code: string | null;
  questions: Question[];
}) {
  const [showCode, setShowCode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const split = showCode && code !== null;
  const selected = questions.find((q) => q.id === selectedId) ?? null;
  const litLines = split && selected && code ? resolveHighlight(code, selected.highlight) : [];

  const base = `/quiz/${problemId}/${approachId}/review`;
  const chip = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
      active ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  let hint = 'Click a question to highlight its lines.';
  if (selected) {
    hint = litLines.length
      ? `Question highlights line${litLines.length > 1 ? 's' : ''} ${describeLines(litLines)}.`
      : 'This question has no specific lines.';
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-5 px-4 py-8 sm:px-6',
        // Split: the page itself is fixed to the screen below the nav bar (56px bar + 1px border),
        // so only the two columns scroll, and the padding and header are tightened to give them
        // as much height as possible. Otherwise a normal scrolling page.
        split ? 'max-w-6xl lg:h-[calc(100vh-3.5rem-1px)] lg:gap-3 lg:overflow-hidden lg:py-4' : 'max-w-3xl'
      )}
    >
      <div className={cn('flex shrink-0 flex-col gap-5', split && 'lg:gap-3')}>
        <Link
          href={`/quiz/${problemId}`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {problemTitle}
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={cn('text-2xl font-semibold tracking-tight', split && 'lg:text-xl')}>Review questions</h1>
            <p className={cn('mt-1 text-sm text-muted-foreground', split && 'lg:hidden')}>
              {problemTitle} · {approachName} · {total} questions. Correct answers are marked; the quiz itself shows the
              options in a random order.
            </p>
          </div>
          {code !== null && (
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              aria-pressed={showCode}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
                showCode
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Code className="size-4" />
              {showCode ? 'Hide your solution' : 'View your solution'}
            </button>
          )}
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Filter by pattern">
          <Link href={base} className={chip(category === null)}>
            All <span className="tabular-nums opacity-70">{total}</span>
          </Link>
          {chips.map((c) => (
            <Link key={c.key} href={`${base}?pattern=${c.key}`} className={chip(category === c.key)} title={c.hint}>
              {c.label} <span className="tabular-nums opacity-70">{c.count}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className={cn(split && 'grid min-h-0 flex-1 gap-5 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]')}>
        {split && code && (
          <Card className="flex min-h-0 flex-col shadow-sm">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 py-4">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Your solution</h2>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </div>
              <CodePanel
                code={code}
                litLines={litLines}
                scrollKey={selectedId ?? ''}
                className="max-h-[45vh] lg:max-h-none lg:min-h-0 lg:flex-1"
              />
            </CardContent>
          </Card>
        )}

        <ol className={cn('flex flex-col gap-3', split && 'min-h-0 lg:overflow-y-auto lg:pb-12 lg:pr-1')} data-review-list>
          {questions.map((q, i) => {
            const lines = code && q.highlight ? describeLines(resolveHighlight(code, q.highlight)) : '';
            const isSelected = split && q.id === selectedId;
            return (
              <li key={q.id}>
                <Card
                  className={cn(
                    'shadow-sm transition-shadow',
                    split && 'cursor-pointer hover:ring-1 hover:ring-primary/40',
                    isSelected && 'ring-2 ring-primary'
                  )}
                  onClick={split ? () => setSelectedId(q.id) : undefined}
                  onKeyDown={
                    split
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedId(q.id);
                          }
                        }
                      : undefined
                  }
                  tabIndex={split ? 0 : undefined}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <CardContent className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">#{i + 1}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {categoryLabel(q.category)}
                      </Badge>
                      {q.verified && (
                        <span
                          className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"
                          title="This answer was checked by running your real code"
                        >
                          <ShieldCheck className="size-3.5" /> checked against your code
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-snug">{q.text}</p>
                    {q.snippet && (
                      <pre className="overflow-x-auto rounded-lg border bg-muted/50 px-3 py-2 font-mono text-[13px] leading-relaxed">
                        <code>{q.snippet}</code>
                      </pre>
                    )}
                    <ul className="flex flex-col gap-1.5">
                      {q.options.map((text, oi) => (
                        <li
                          key={oi}
                          className={cn(
                            'flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm',
                            oi === q.correctIndex
                              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                              : 'text-muted-foreground'
                          )}
                        >
                          <span className="mt-px w-4 shrink-0 text-xs font-medium">{LETTERS[oi]}</span>
                          <span className="min-w-0 flex-1">{text}</span>
                          {oi === q.correctIndex && (
                            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="Correct" />
                          )}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                        <span className="mb-0.5 block text-xs font-medium text-muted-foreground">Explanation</span>
                        {q.explanation}
                        {lines && (
                          <span className="mt-1.5 block text-xs text-muted-foreground">
                            Highlights line{/[,–]/.test(lines) ? 's' : ''} {lines} of your code.
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
