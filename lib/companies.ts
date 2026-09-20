// Pure helpers only — this module is imported by client components (the CompanyWise panel) and by
// lib/roadmapFilters.ts. The logo lookup reads the filesystem and lives in lib/companyLogos.ts,
// which must only be imported from server components.

export type CompanyInfo = {
  id: string;
  name: string;
  slug: string;
  isPreferred: boolean;
  /** How many roadmap problems this company asks. */
  count: number;
  /** Resolved logo path, or null to fall back to initials. */
  logo: string | null;
};

/** "Goldman Sachs" -> "goldman-sachs". Also the logo filename and the URL value for the filter. */
export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Up to two letters for the fallback badge: "Goldman Sachs" -> "GS", "Adobe" -> "AD". */
export function companyInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// A stable colour per company so the initials badges are distinguishable without changing between
// renders. Hue from the name, fixed saturation/lightness so they sit together calmly.
export function companyTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash} 45% 45%)`;
}
