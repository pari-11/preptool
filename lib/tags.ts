// Tag colours are stored as a key ("amber") on Tag.color and mapped to classes here, so Tailwind
// sees the full class strings.
export const TAG_COLORS = {
  amber: { chip: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25', dot: 'bg-amber-500' },
  rose: { chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25', dot: 'bg-rose-500' },
  violet: { chip: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25', dot: 'bg-violet-500' },
  sky: { chip: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25', dot: 'bg-sky-500' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25', dot: 'bg-emerald-500' },
  indigo: { chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/25', dot: 'bg-indigo-500' },
  pink: { chip: 'bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:ring-pink-500/25', dot: 'bg-pink-500' },
  teal: { chip: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/25', dot: 'bg-teal-500' },
  orange: { chip: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/25', dot: 'bg-orange-500' },
  slate: { chip: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/25', dot: 'bg-slate-500' },
} as const;

export type TagColor = keyof typeof TAG_COLORS;

// New custom tags take these in turn (the presets already use amber, rose, violet, sky, emerald).
export const CUSTOM_TAG_COLOR_ORDER: TagColor[] = [
  'indigo',
  'pink',
  'teal',
  'orange',
  'slate',
  'rose',
  'amber',
  'emerald',
  'sky',
  'violet',
];

// `count` is how many problems carry the tag.
export type TagInfo = { id: string; name: string; color: string; isPreset: boolean; count: number };

export const MAX_TAG_NAME_LENGTH = 24;

export function tagStyle(color: string) {
  return TAG_COLORS[color as TagColor] ?? TAG_COLORS.slate;
}

export function cleanTagName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}
