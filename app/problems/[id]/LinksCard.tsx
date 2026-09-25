'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import type { ItemLinkType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DisplayLink } from '@/lib/itemLinks';
import { addProblemLink, removeProblemLink, runProblemSearch } from '@/app/actions';

const LINK_TYPE_OPTIONS: { value: ItemLinkType; label: string }[] = [
  { value: 'SameInsight', label: 'Same insight' },
  { value: 'SameProblem', label: 'Same problem' },
  { value: 'HarderVariant', label: 'Harder variant' },
  { value: 'Prerequisite', label: 'Prerequisite' },
  { value: 'FreeForm', label: 'Free-form' },
];

const DIFFICULTY_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' } as const;

type ProblemMatch = { id: string; title: string; difficulty: 'Easy' | 'Medium' | 'Hard' | null };

// The search box here is app/actions.ts's runProblemSearch — the same matching rule as the header
// search's Problem half (lib/search.ts), just scoped to "not this problem" (spec 010 L4).
function AddLinkForm({ problemId, onAdded }: { problemId: string; onAdded: () => void }) {
  const [linkType, setLinkType] = useState<ItemLinkType>('SameInsight');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ProblemMatch[]>([]);
  const [target, setTarget] = useState<ProblemMatch | null>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search(q: string) {
    setQuery(q);
    setTarget(null);
    setError(null);
    if (q.trim().length < 2) {
      setMatches([]);
      return;
    }
    startTransition(async () => {
      setMatches(await runProblemSearch(q, problemId));
    });
  }

  function submit() {
    if (!target) {
      setError('Pick a problem first.');
      return;
    }
    if (linkType === 'FreeForm' && !label.trim()) {
      setError('Free-form links need a label.');
      return;
    }
    startTransition(async () => {
      await addProblemLink(problemId, target.id, linkType, label);
      setQuery('');
      setMatches([]);
      setTarget(null);
      setLabel('');
      setError(null);
      onAdded();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={linkType}
          onChange={(e) => setLinkType(e.target.value as ItemLinkType)}
          aria-label="Link type"
          className="h-8 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:border-primary"
        >
          {LINK_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={linkType === 'FreeForm' ? 'Label (required)' : 'Note (optional)'}
          aria-label="Link label"
          className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:border-primary"
        />
      </div>

      {target ? (
        <div className="flex items-center gap-2 rounded-md bg-background px-2 py-1.5 text-[13px]">
          {target.difficulty && <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[target.difficulty])} />}
          <span className="min-w-0 flex-1 truncate font-medium">{target.title}</span>
          <button
            type="button"
            onClick={() => setTarget(null)}
            aria-label="Change target problem"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search for the other problem…"
            aria-label="Search for the target problem"
            className="h-8 w-full rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:border-primary"
          />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-card shadow-lg">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTarget(m);
                      setMatches([]);
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px] hover:bg-muted"
                  >
                    {m.difficulty && <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[m.difficulty])} />}
                    <span className="min-w-0 flex-1 truncate">{m.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-[12px] text-destructive">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="self-start rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
      >
        Add link
      </button>
    </div>
  );
}

// Links between this problem and any other (spec 010): existing links merged from both directions
// (see lib/itemLinks.ts for the direction-aware wording) and an "Add link" form. v1 is problem-to-
// problem only.
export function LinksCard({ problemId, links }: { problemId: string; links: DisplayLink[] }) {
  const [showForm, setShowForm] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const visible = links.filter((l) => !removed.has(l.id));

  function remove(id: string) {
    setRemoved((s) => new Set(s).add(id));
    startTransition(async () => {
      await removeProblemLink(id);
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Links</CardTitle>
        <CardAction>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" /> Add link
          </button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showForm && <AddLinkForm problemId={problemId} onAdded={() => setShowForm(false)} />}

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No links yet — connect this to a problem that shares its insight, or a harder/easier variant.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {link.wording}
                </Badge>
                {link.otherProblemDifficulty && (
                  <span className={cn('size-1.5 shrink-0 rounded-full', DIFFICULTY_DOT[link.otherProblemDifficulty])} />
                )}
                <Link href={`/problems/${link.otherProblemId}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                  {link.otherProblemTitle}
                </Link>
                {link.label && <span className="shrink-0 text-xs italic text-muted-foreground">"{link.label}"</span>}
                <button
                  type="button"
                  onClick={() => remove(link.id)}
                  disabled={pending}
                  aria-label="Remove link"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
