import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

// Solved state lives on the placement (a problem in a stage), so a problem that sits in two
// stages (e.g. LC 268) is ticked independently in each. Problem.is_solved is the roll-up:
// true when solved in at least one placement. A problem with no placement (company data
// only) is solved at problem level, so its flag is set directly and never recomputed here.
export async function recomputeRollup(tx: Tx, problemId: string) {
  const placements = await tx.problemStage.count({ where: { problem_id: problemId } });
  if (placements === 0) return;
  const solved = await tx.problemStage.count({ where: { problem_id: problemId, is_solved: true } });
  await tx.problem.update({ where: { id: problemId }, data: { is_solved: solved > 0 } });
}

// Records one solve event: marks the placement solved, adds a ReviewLog row, clears the
// rating so the fresh solve gets rated fresh, and stamps last_solved_date.
// stage_id goes on the log row only when the problem is in more than one stage.
// solvedAt = null is a backfilled solve with an unknown date; it leaves last_solved_date as is.
export async function recordSolve(
  tx: Tx,
  problemId: string,
  stageId: string | null,
  solvedAt: Date | null
) {
  const placements = await tx.problemStage.findMany({
    where: { problem_id: problemId },
    select: { stage_id: true },
  });

  let logStageId: string | null = null;
  if (placements.length > 1) {
    if (!stageId || !placements.some((p) => p.stage_id === stageId)) {
      throw new Error('This problem is in several stages; a stage from that list is required.');
    }
    logStageId = stageId;
  }

  const placementStageId = placements.length === 0 ? null : (stageId ?? placements[0].stage_id);
  if (placementStageId) {
    if (!placements.some((p) => p.stage_id === placementStageId)) {
      throw new Error('That stage does not contain this problem.');
    }
    await tx.problemStage.update({
      where: { problem_id_stage_id: { problem_id: problemId, stage_id: placementStageId } },
      data: { is_solved: true },
    });
  }

  await tx.reviewLog.create({
    data: { problem_id: problemId, stage_id: logStageId, event_type: 'Solved', solved_at: solvedAt },
  });

  if (placements.length === 0) {
    await tx.problem.update({ where: { id: problemId }, data: { is_solved: true } });
  } else {
    await recomputeRollup(tx, problemId);
  }

  // A solve is always review-worthy, so it resets the review queue's staleness clock too.
  await tx.problem.update({
    where: { id: problemId },
    data: solvedAt
      ? { last_solved_date: solvedAt, last_reviewed_date: solvedAt, confidence: null }
      : { confidence: null },
  });
}

// Records a lighter review event that doesn't drive any placement's checkbox: 'Revised' (re-read
// the solution or notes without a fresh solve) or 'Revisited' (just looked at it again). Unlike a
// solve, there's no placement to disambiguate — stageId is recorded on the log row for context
// when the caller has it, but is never required. Only 'Revised' resets the review queue's
// staleness clock; a bare glance shouldn't let a problem hide from the queue.
export async function recordReview(
  tx: Tx,
  problemId: string,
  stageId: string | null,
  kind: 'Revised' | 'Revisited'
) {
  const now = new Date();
  await tx.reviewLog.create({
    data: { problem_id: problemId, stage_id: stageId, event_type: kind, solved_at: now },
  });
  if (kind === 'Revised') {
    await tx.problem.update({ where: { id: problemId }, data: { last_reviewed_date: now } });
  }
}

// Removes the most recent 'Revisited' log row, if any — for the undo button next to the
// Revisited? counter on an accidental click. Never touches Solved or Revised rows, and does
// nothing (not an error) if there's nothing to undo.
export async function undoLastRevisit(tx: Tx, problemId: string) {
  const last = await tx.reviewLog.findFirst({
    where: { problem_id: problemId, event_type: 'Revisited' },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: { id: true },
  });
  if (last) {
    await tx.reviewLog.delete({ where: { id: last.id } });
  }
}

// Unticking only flips the solved flag. History, rating, dates and the note are kept.
export async function clearSolved(tx: Tx, problemId: string, stageId: string | null) {
  if (stageId) {
    await tx.problemStage.update({
      where: { problem_id_stage_id: { problem_id: problemId, stage_id: stageId } },
      data: { is_solved: false },
    });
    await recomputeRollup(tx, problemId);
  } else {
    await tx.problem.update({ where: { id: problemId }, data: { is_solved: false } });
  }
}
