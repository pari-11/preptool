'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isValidConfidence } from '@/lib/confidence';
import { clearSolved, recordSolve } from '@/lib/solve';
import { CUSTOM_TAG_COLOR_ORDER, MAX_TAG_NAME_LENGTH, cleanTagName, isTagColor } from '@/lib/tags';

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/problems/[id]', 'page');
}

// Ticking on records a solve (see lib/solve.ts); ticking off only clears the flag.
// stageId is null for a problem with no roadmap placement (solved at problem level).
export async function toggleSolved(problemId: string, stageId: string | null, nextValue: boolean) {
  await prisma.$transaction(async (tx) => {
    if (nextValue) {
      await recordSolve(tx, problemId, stageId, new Date());
    } else {
      await clearSolved(tx, problemId, stageId);
    }
  });
  revalidateAll();
}

// Re-solve: adds another solve to the history without a toggle. For a problem in several
// stages the stage is required; it is marked solved there if it wasn't already.
export async function logSolve(problemId: string, stageId: string | null) {
  await prisma.$transaction((tx) => recordSolve(tx, problemId, stageId, new Date()));
  revalidateAll();
}

// Rates the problem's current solve: sets Problem.confidence and the latest ReviewLog row.
// Only solved problems can be rated. null clears the rating.
export async function setConfidence(problemId: string, value: number | null) {
  if (value !== null && !isValidConfidence(value)) {
    throw new Error('Confidence must be a whole number from 1 to 5.');
  }
  await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.findUnique({
      where: { id: problemId },
      select: { is_solved: true },
    });
    if (!problem) throw new Error('Problem not found.');
    if (!problem.is_solved) throw new Error('Only a solved problem can be rated.');

    const latest = await tx.reviewLog.findFirst({
      where: { problem_id: problemId },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });
    if (latest) {
      await tx.reviewLog.update({ where: { id: latest.id }, data: { confidence_at_time: value } });
    } else {
      // Solved before history existed: give the rating a row to live on.
      await tx.reviewLog.create({ data: { problem_id: problemId, confidence_at_time: value } });
    }
    await tx.problem.update({ where: { id: problemId }, data: { confidence: value } });
  });
  revalidateAll();
}

export async function saveNote(problemId: string, text: string) {
  const trimmed = text.trim();
  await prisma.problem.update({
    where: { id: problemId },
    data: { user_note: trimmed === '' ? null : trimmed },
  });
  revalidatePath('/problems/[id]', 'page');
}

export type CreatedTag = { id: string; name: string; color: string };
export type CreateTagResult = { ok: true; tag: CreatedTag } | { ok: false; error: string };

// Creates a custom tag (or reuses an existing one with the same name, ignoring case, keeping its
// colour) and, when a problem is given, puts it on that problem. `color` is one of the palette
// colours; without it the next colour in a fixed rotation is used.
export async function createTag(
  rawName: string,
  applyToProblemId: string | null,
  color?: string
): Promise<CreateTagResult> {
  const name = cleanTagName(rawName);
  if (!name) return { ok: false, error: 'Give the tag a name.' };
  if (name.length > MAX_TAG_NAME_LENGTH) {
    return { ok: false, error: `Tag names can be at most ${MAX_TAG_NAME_LENGTH} characters.` };
  }
  if (color !== undefined && !isTagColor(color)) return { ok: false, error: 'Pick one of the available colours.' };

  let tag = await prisma.tag.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  if (!tag) {
    const count = await prisma.tag.count({ where: { is_preset: false } });
    tag = await prisma.tag.create({
      data: { name, color: color ?? CUSTOM_TAG_COLOR_ORDER[count % CUSTOM_TAG_COLOR_ORDER.length] },
    });
  }
  if (applyToProblemId) {
    await prisma.problemTag.upsert({
      where: { problem_id_tag_id: { problem_id: applyToProblemId, tag_id: tag.id } },
      create: { problem_id: applyToProblemId, tag_id: tag.id },
      update: {},
    });
  }
  revalidateAll();
  return { ok: true, tag: { id: tag.id, name: tag.name, color: tag.color } };
}

// Puts a tag on a problem or takes it off. Explicit on/off, so repeating a call is harmless.
export async function setProblemTag(problemId: string, tagId: string, on: boolean) {
  if (on) {
    await prisma.problemTag.upsert({
      where: { problem_id_tag_id: { problem_id: problemId, tag_id: tagId } },
      create: { problem_id: problemId, tag_id: tagId },
      update: {},
    });
  } else {
    await prisma.problemTag.deleteMany({ where: { problem_id: problemId, tag_id: tagId } });
  }
  revalidateAll();
}

// Renames a tag and/or changes its colour in one save (any tag, presets included). The name gets
// the same cleaning and length limit as a new tag and must not clash, ignoring case, with another
// tag (changing only the capitalisation of its own name is fine). The colour must be one of the
// palette colours in lib/tags.ts.
export async function updateTag(tagId: string, rawName: string, color: string): Promise<CreateTagResult> {
  const name = cleanTagName(rawName);
  if (!name) return { ok: false, error: 'Give the tag a name.' };
  if (name.length > MAX_TAG_NAME_LENGTH) {
    return { ok: false, error: `Tag names can be at most ${MAX_TAG_NAME_LENGTH} characters.` };
  }
  if (!isTagColor(color)) return { ok: false, error: 'Pick one of the available colours.' };

  const clash = await prisma.tag.findFirst({
    where: { id: { not: tagId }, name: { equals: name, mode: 'insensitive' } },
    select: { name: true },
  });
  if (clash) return { ok: false, error: `There is already a tag called "${clash.name}".` };

  const { count } = await prisma.tag.updateMany({ where: { id: tagId }, data: { name, color } });
  if (count === 0) return { ok: false, error: 'That tag no longer exists.' };
  revalidateAll();
  return { ok: true, tag: { id: tagId, name, color } };
}

// Deletes a tag everywhere, including the pre-added ones (someone who only wants custom tags can
// clear them out). Links to problems go with it.
export async function deleteTag(tagId: string) {
  await prisma.tag.deleteMany({ where: { id: tagId } });
  revalidateAll();
}
