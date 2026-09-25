import type { Difficulty, ItemLinkType, LinkCreator } from '@prisma/client';
import { prisma } from './prisma';

// Manual problem-to-problem links (spec 010, v1 of the vision doc's link layer). ItemLink is
// polymorphic with no FK integrity by design — everything here writes/reads from_type = to_type =
// "Problem" only; a Resource or Concept side can join in later without a migration.

const SYMMETRIC_TYPES: ItemLinkType[] = ['SameProblem', 'SameInsight'];

export type DisplayLink = {
  id: string;
  otherProblemId: string;
  otherProblemTitle: string;
  otherProblemDifficulty: Difficulty | null;
  linkType: ItemLinkType;
  label: string | null;
  wording: string;
  createdBy: LinkCreator;
};

// Symmetric types read the same from either end; directional ones don't — HarderVariant/
// Prerequisite carry a "from is the easier/earlier side" meaning (see the schema comment).
function wording(linkType: ItemLinkType, isFrom: boolean): string {
  switch (linkType) {
    case 'SameProblem':
      return 'Same problem';
    case 'SameInsight':
      return 'Same insight';
    case 'HarderVariant':
      return isFrom ? 'Harder variant' : 'Easier version';
    case 'Prerequisite':
      return isFrom ? 'Leads to' : 'Requires first';
    case 'FreeForm':
      return 'Related';
  }
}

export async function getProblemLinks(problemId: string): Promise<DisplayLink[]> {
  const rows = await prisma.itemLink.findMany({
    where: {
      OR: [
        { from_type: 'Problem', from_id: problemId },
        { to_type: 'Problem', to_id: problemId },
      ],
    },
    orderBy: { created_at: 'desc' },
  });
  if (rows.length === 0) return [];

  const otherIds = rows.map((r) => (r.from_id === problemId ? r.to_id : r.from_id));
  const others = await prisma.problem.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, title: true, difficulty: true },
  });
  const byId = new Map(others.map((p) => [p.id, p]));

  return rows
    .map((r) => {
      const isFrom = r.from_id === problemId;
      const other = byId.get(isFrom ? r.to_id : r.from_id);
      // No FK integrity on this table by design — if the other problem is gone there is nothing
      // sensible to show, so the row is dropped rather than rendered broken.
      if (!other) return null;
      return {
        id: r.id,
        otherProblemId: other.id,
        otherProblemTitle: other.title,
        otherProblemDifficulty: other.difficulty,
        linkType: r.link_type,
        label: r.label,
        wording: wording(r.link_type, isFrom),
        createdBy: r.created_by,
      };
    })
    .filter((x): x is DisplayLink => x !== null);
}

export async function createProblemLink(
  fromProblemId: string,
  toProblemId: string,
  linkType: ItemLinkType,
  label: string | null
) {
  if (fromProblemId === toProblemId) {
    throw new Error('A problem cannot be linked to itself.');
  }
  const cleanLabel = label?.trim() || null;
  if (linkType === 'FreeForm' && !cleanLabel) {
    throw new Error('A free-form link needs a label.');
  }

  const symmetric = SYMMETRIC_TYPES.includes(linkType);
  const existing = await prisma.itemLink.findFirst({
    where: symmetric
      ? {
          link_type: linkType,
          OR: [
            { from_type: 'Problem', from_id: fromProblemId, to_type: 'Problem', to_id: toProblemId },
            { from_type: 'Problem', from_id: toProblemId, to_type: 'Problem', to_id: fromProblemId },
          ],
        }
      : { link_type: linkType, from_type: 'Problem', from_id: fromProblemId, to_type: 'Problem', to_id: toProblemId },
  });
  // A duplicate edge is a no-op, not an error — the user's intent ("these two are the same
  // insight") is already recorded.
  if (existing) return existing;

  return prisma.itemLink.create({
    data: {
      from_type: 'Problem',
      from_id: fromProblemId,
      to_type: 'Problem',
      to_id: toProblemId,
      link_type: linkType,
      label: cleanLabel,
    },
  });
}

export async function deleteItemLink(linkId: string) {
  await prisma.itemLink.deleteMany({ where: { id: linkId } });
}
