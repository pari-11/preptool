import 'server-only';

import { readdirSync } from 'fs';
import { join } from 'path';

const LOGO_DIR = join(process.cwd(), 'public', 'companies');
// Best format first: a vector scales cleanly at chip size, an .ico is the last resort (favicons are
// all some brands publish) and may carry several bitmap sizes in one file.
const LOGO_EXTENSIONS = ['svg', 'png', 'webp', 'jpg', 'jpeg', 'ico'];

let cache: Map<string, string> | null = null;

// Which companies have a logo file, read once per server process. Rendering an <img> that 404s
// would need a client component to catch the error, so the server checks the directory instead and
// the caller falls back to initials. Drop a file in named after the company slug
// (public/companies/goldman-sachs.svg) and restart the dev server to pick it up.
function index(): Map<string, string> {
  if (cache) return cache;
  const found = new Map<string, string>();
  const rank = new Map<string, number>();
  try {
    for (const file of readdirSync(LOGO_DIR)) {
      const dot = file.lastIndexOf('.');
      if (dot <= 0) continue;
      const ext = file.slice(dot + 1).toLowerCase();
      const base = file.slice(0, dot).toLowerCase();
      const order = LOGO_EXTENSIONS.indexOf(ext);
      if (order === -1) continue;
      // Directory order is arbitrary, so keep the best format rather than the first one seen.
      if (found.has(base) && rank.get(base)! <= order) continue;
      found.set(base, `/companies/${encodeURIComponent(file)}`);
      rank.set(base, order);
    }
  } catch {
    // No public/companies directory yet — every company falls back to initials.
  }
  cache = found;
  return cache;
}

export function logoSrc(slug: string): string | null {
  return index().get(slug) ?? null;
}
