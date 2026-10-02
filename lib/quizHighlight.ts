// Spec 011: which lines of an approach's code a question's explanation is about. Stored as
// matching text rather than line numbers so it survives edits to the stored code, and pure (no
// database) so the seed script and the browser resolve highlights with the same function.
//
// A spec is either
//   - a string: every line that contains it is highlighted, or
//   - { from, to, nth? }: a block, from the nth (default first) line containing `from` through the
//     first line at or after it that contains `to`.

export type HighlightSpec = string | { from: string; to: string; nth?: number };

// Returns the 0-based line indexes to highlight, sorted. A spec that matches nothing adds nothing
// here; `unresolvedSpecs` is how the seed script finds those.
export function resolveHighlight(code: string, specs: HighlightSpec[] | null | undefined): number[] {
  if (!specs || specs.length === 0) return [];
  const lines = code.split('\n');
  const hit = new Set<number>();
  for (const spec of specs) for (const i of resolveSpec(lines, spec)) hit.add(i);
  return [...hit].sort((a, b) => a - b);
}

function resolveSpec(lines: string[], spec: HighlightSpec): number[] {
  if (typeof spec === 'string') {
    return lines.flatMap((line, i) => (spec !== '' && line.includes(spec) ? [i] : []));
  }
  const wanted = spec.nth ?? 1;
  let seen = 0;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(spec.from) && ++seen === wanted) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].includes(spec.to)) {
      end = i;
      break;
    }
  }
  if (end < 0) return [];
  return Array.from({ length: end - start + 1 }, (_, k) => start + k);
}

export function unresolvedSpecs(code: string, specs: HighlightSpec[]): HighlightSpec[] {
  const lines = code.split('\n');
  return specs.filter((spec) => resolveSpec(lines, spec).length === 0);
}

// Reads the JSON column back into specs, dropping anything malformed instead of trusting it.
export function asHighlight(value: unknown): HighlightSpec[] | null {
  if (!Array.isArray(value)) return null;
  const specs: HighlightSpec[] = [];
  for (const item of value) {
    if (typeof item === 'string') specs.push(item);
    else if (item && typeof item === 'object' && typeof item.from === 'string' && typeof item.to === 'string') {
      specs.push({ from: item.from, to: item.to, ...(Number.isInteger(item.nth) ? { nth: item.nth } : {}) });
    }
  }
  return specs.length ? specs : null;
}

// "12", "12–18", "12–18, 25" — 1-based, for showing the user what a highlight covers.
export function describeLines(indexes: number[]): string {
  const ranges: string[] = [];
  for (let i = 0; i < indexes.length; i++) {
    let j = i;
    while (j + 1 < indexes.length && indexes[j + 1] === indexes[j] + 1) j++;
    ranges.push(j === i ? `${indexes[i] + 1}` : `${indexes[i] + 1}–${indexes[j] + 1}`);
    i = j;
  }
  return ranges.join(', ');
}
