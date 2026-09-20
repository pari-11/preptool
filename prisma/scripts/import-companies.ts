import { PrismaClient, Difficulty } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const RAW_DIR = join(__dirname, '..', 'data', 'raw');

// Manual cleanup for company names that appear inconsistently-cased in the source PDF.
const COMPANY_NAME_FIXES: Record<string, string> = {
  'jpmorgan': 'JPMorgan',
  'De-shaw': 'DE Shaw',
  'Linkedin': 'LinkedIn',
  'AMD': 'AMD',
  'IMC': 'IMC',
  'DRW': 'DRW',
  'Sig': 'SIG',
};

function normalizeCompanyName(raw: string): string {
  return COMPANY_NAME_FIXES[raw] ?? raw;
}

interface ParsedRow {
  company: string;
  leetcodeId: number;
  url: string;
  title: string;
  difficulty: Difficulty;
  acceptance: number;
  frequency: number | null;
}

// Frequency % is optional: a few source rows (e.g. IMC's Trapping Rain Water) are truncated
// in the original PDF and only have an acceptance percentage.
const ROW_RE =
  /^(\d+)\s+(https:\/\/leetcode\.com\/problems\/[a-z0-9-]+)\s+(.+?)\s+(Easy|Medium|Hard)\s+([\d.]+)%(?:\s+([\d.]+)%)?\s*$/;

function parseFile(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let currentCompany: string | null = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = ROW_RE.exec(line);
    if (match) {
      if (!currentCompany) {
        console.warn(`Skipping row with no company context: ${line}`);
        continue;
      }
      const [, leetcodeId, url, title, difficulty, acceptance, frequency] = match;
      rows.push({
        company: currentCompany,
        leetcodeId: parseInt(leetcodeId, 10),
        url,
        title: title.trim(),
        difficulty: difficulty as Difficulty,
        acceptance: parseFloat(acceptance),
        frequency: frequency !== undefined ? parseFloat(frequency) : null,
      });
    } else {
      // Not a data row -> treat as a company header line.
      currentCompany = normalizeCompanyName(line);
    }
  }

  return rows;
}

// "Done?" cells were rendered as color highlights in the source PDF, which do not survive
// text extraction reliably — there is no trustworthy per-row signal available here for which
// problems were marked solved. All problems import with is_solved = false (the field's
// default); toggle them manually once the per-company dashboard exists.

async function main() {
  const files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.txt'));
  const allRows: ParsedRow[] = [];

  for (const file of files) {
    const text = readFileSync(join(RAW_DIR, file), 'utf-8');
    allRows.push(...parseFile(text));
  }

  console.log(`Parsed ${allRows.length} rows across ${files.length} files.`);

  const companyNames = new Set(allRows.map((r) => r.company));
  const companyIdByName = new Map<string, string>();

  for (const name of companyNames) {
    const company = await prisma.company.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    companyIdByName.set(name, company.id);
  }
  console.log(`Upserted ${companyIdByName.size} companies.`);

  const problemsById = new Map<number, ParsedRow>();
  // company name -> that company's frequency % for this problem. Keyed per company because the
  // source states the ask-rate per (company, problem); one number on the problem cannot hold it.
  const companiesById = new Map<number, Map<string, number | null>>();
  const titleConflicts: string[] = [];

  for (const row of allRows) {
    const existing = problemsById.get(row.leetcodeId);
    if (!existing) {
      problemsById.set(row.leetcodeId, row);
    } else if (existing.title !== row.title || existing.url !== row.url) {
      titleConflicts.push(
        `LC ${row.leetcodeId}: "${existing.title}" (${existing.url}) vs "${row.title}" (${row.url}) — kept first`
      );
    }
    if (!companiesById.has(row.leetcodeId)) {
      companiesById.set(row.leetcodeId, new Map());
    }
    companiesById.get(row.leetcodeId)!.set(row.company, row.frequency);
  }

  if (titleConflicts.length > 0) {
    console.warn(`\n${titleConflicts.length} title/URL mismatch(es) for the same LeetCode ID (likely source typos):`);
    titleConflicts.forEach((c) => console.warn(`  ${c}`));
    console.warn('');
  }

  console.log(`${problemsById.size} unique problems to import.`);

  let created = 0;
  let linked = 0;

  for (const [leetcodeId, row] of problemsById) {
    const problem = await prisma.problem.upsert({
      where: { leetcode_id: leetcodeId },
      create: {
        title: row.title,
        leetcode_id: leetcodeId,
        source_link: row.url,
        difficulty: row.difficulty,
        acceptance_rate: row.acceptance,
        // Deliberately null: frequency belongs per company, on ProblemCompany below.
        frequency: null,
      },
      update: {
        acceptance_rate: row.acceptance,
        frequency: null,
      },
    });
    created++;

    const companies = companiesById.get(leetcodeId)!;
    for (const [companyName, frequency] of companies) {
      const companyId = companyIdByName.get(companyName)!;
      await prisma.problemCompany.upsert({
        where: {
          problem_id_company_id: {
            problem_id: problem.id,
            company_id: companyId,
          },
        },
        create: { problem_id: problem.id, company_id: companyId, frequency },
        update: { frequency },
      });
      linked++;
    }
  }

  console.log(`Upserted ${created} problems, ${linked} problem-company links.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
