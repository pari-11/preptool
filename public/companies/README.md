# Company logos

44 of the 47 companies have a logo here. The rest fall back to their initials on a tinted square,
which is a supported state, not a gap to fill — see `CompanyLogo` in `app/CompanyLogo.tsx`.

## Adding or replacing one

Name the file after the company's slug: its name lowercased with non-alphanumerics turned into
hyphens (`lib/companies.ts` → `companySlug`).

| Company        | File                 |
| -------------- | -------------------- |
| Adobe          | `adobe.png`          |
| Goldman Sachs  | `goldman-sachs.svg`  |
| Morgan Stanley | `morgan-stanley.png` |
| Arista Networks| `arista-networks.ico`|

`.svg`, `.png`, `.webp`, `.jpg`, `.jpeg` and `.ico` all work. If a company has more than one file,
the best format wins in that order — so dropping in `adobe.svg` supersedes `adobe.png` without
deleting anything.

The directory is read **once per server process**, so restart `npm run dev` after adding files.

## Where these came from

- **24 as SVG** from [Simple Icons](https://simpleicons.org) (CC0), recoloured to each brand's
  official hex so they read at 14px.
- **20 as PNG/ICO** from public favicon endpoints (DuckDuckGo, with Google as fallback), because
  Simple Icons has dropped most large brands — Adobe, Microsoft, LinkedIn, Bloomberg and the banks
  are all absent from it now.
- **3 have no logo**: BlackRock, Citadel and Millenium. No endpoint returned a usable image.

The marks belong to their respective owners and are used here only to identify the company inside a
personal, local tool.
