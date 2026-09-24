import { ChevronRight } from 'lucide-react';
import {
  getStrengthsWeaknesses,
  MIN_SAMPLE,
  STRONG_AVG_THRESHOLD,
  type UnitStrength,
} from '@/lib/strengthsWeaknesses';
import { cn } from '@/lib/utils';

const SCALE_MAX = 5; // confidence is rated 1-5

// The rating meter: filled to the topic's average on a 1-5 scale, with a tick at the "strong" line,
// so it reads as "how far from strong" without any explanation. Empty when nothing is rated.
function Meter({ unit }: { unit: UnitStrength }) {
  const filled = unit.average === null ? 0 : (unit.average / SCALE_MAX) * 100;
  return (
    <div
      role="img"
      aria-label={unit.average === null ? 'Not rated yet' : `Average confidence ${unit.average.toFixed(1)} out of ${SCALE_MAX}`}
      className="relative h-1.5 min-w-16 flex-1 rounded-full bg-muted"
    >
      <div
        className={cn('h-full rounded-full', unit.state === 'strong' ? 'bg-emerald-500' : 'bg-amber-500')}
        style={{ width: `${filled}%` }}
      />
      <span
        title={`Strong from ${STRONG_AVG_THRESHOLD}`}
        className="absolute -top-[3px] h-[calc(100%+6px)] w-px bg-foreground/40"
        style={{ left: `${(STRONG_AVG_THRESHOLD / SCALE_MAX) * 100}%` }}
      />
    </div>
  );
}

// "avg 4.2 · 1 due · 2 unrated" — the details that explain the bar (only shown when rated).
function detail(unit: UnitStrength): string {
  const parts = [`avg ${(unit.average ?? 0).toFixed(1)}`];
  if (unit.dueCount > 0) parts.push(`${unit.dueCount} due`);
  if (unit.unrated > 0) parts.push(`${unit.unrated} unrated`);
  return parts.join(' · ');
}

// One topic. With no ratings there is nothing to plot, so it stays a single line; once rated it
// gets the meter and the details under it.
function Row({ unit }: { unit: UnitStrength }) {
  const rated = unit.average !== null;
  return (
    <li className="py-1.5">
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate" title={unit.title}>
          <span className="text-sm font-medium">{unit.name}</span>
          <span className="ml-1.5 text-[11px] text-muted-foreground">{unit.kicker}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {unit.solved}/{unit.total} solved{rated ? '' : ' · not rated yet'}
        </span>
      </div>
      {rated && (
        <div className="mt-1 flex items-center gap-2">
          <Meter unit={unit} />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{detail(unit)}</span>
        </div>
      )}
    </li>
  );
}

function Legend({ dot, label, count }: { dot: string; label: string; count: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', dot)} />
      <span className="font-medium tabular-nums text-foreground">{count}</span>
      {label}
    </span>
  );
}

// Where preparation is solid and where it only looks done (spec 006 part E): one bar for the whole
// picture, then a meter per topic that has enough solves to judge. Topics below the sample size are
// "not reached" — neutral, folded away, never listed as a weakness.
export async function StrengthsWeaknessesCard() {
  const units = await getStrengthsWeaknesses();
  const strong = units.filter((u) => u.state === 'strong');
  const weak = units.filter((u) => u.state === 'weak');
  const notReached = units.filter((u) => u.state === 'not-reached');
  const anyUnrated = weak.some((u) => u.reason === 'unrated');

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Strengths &amp; weaknesses</span>
        <span className="text-xs tabular-nums text-muted-foreground">{units.length} topics</span>
      </div>

      {/* The whole picture at a glance. */}
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${strong.length} strong, ${weak.length} need a second look, ${notReached.length} not reached`}>
        {strong.length > 0 && <div className="bg-emerald-500" style={{ flex: `${strong.length} 0 0` }} />}
        {weak.length > 0 && <div className="bg-amber-500" style={{ flex: `${weak.length} 0 0` }} />}
        {notReached.length > 0 && <div className="bg-muted-foreground/25" style={{ flex: `${notReached.length} 0 0` }} />}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Legend dot="bg-emerald-500" label="strong" count={strong.length} />
        <Legend dot="bg-amber-500" label="need a second look" count={weak.length} />
        <Legend dot="bg-muted-foreground/40" label="not reached" count={notReached.length} />
      </div>

      {strong.length === 0 && weak.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Solve at least {MIN_SAMPLE} problems in a topic and it shows up here with its rating.
        </p>
      ) : (
        <div className="mt-2 max-h-80 overflow-y-auto overflow-x-hidden">
          {strong.length > 0 && (
            <>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Strong</p>
              <ul className="divide-y">
                {strong.map((u) => (
                  <Row key={u.key} unit={u} />
                ))}
              </ul>
            </>
          )}
          {weak.length > 0 && (
            <>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Needs a second look
              </p>
              <ul className="divide-y">
                {weak.map((u) => (
                  <Row key={u.key} unit={u} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {anyUnrated && (
        <p className="mt-2 text-xs text-muted-foreground">
          Rate the problems you've solved on the roadmap to tell strong from weak.
        </p>
      )}

      {notReached.length > 0 && (
        <details className="group mt-3 border-t pt-2">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
            {notReached.length} not reached yet — not counted against you
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {notReached.map((u) => (
              <li key={u.key} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground" title={`${u.kicker}: ${u.solved} of ${u.total} solved`}>
                {u.name}
                {u.solved > 0 && (
                  <span className="ml-1 tabular-nums text-foreground">
                    {u.solved}/{u.total}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
