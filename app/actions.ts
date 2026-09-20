'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Solved state lives on the placement (a problem in a stage), so a problem that sits in
// two stages (e.g. LC 268) can be ticked independently in each. Problem.is_solved is kept
// as the roll-up: true when the problem is solved in at least one placement.
export async function toggleSolved(problemId: string, stageId: string, nextValue: boolean) {
  await prisma.$transaction(async (tx) => {
    await tx.problemStage.update({
      where: { problem_id_stage_id: { problem_id: problemId, stage_id: stageId } },
      data: { is_solved: nextValue },
    });
    const solvedPlacements = await tx.problemStage.count({
      where: { problem_id: problemId, is_solved: true },
    });
    await tx.problem.update({
      where: { id: problemId },
      data: { is_solved: solvedPlacements > 0 },
    });
  });
  revalidatePath('/');
}
