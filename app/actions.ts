'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function toggleSolved(problemId: string, nextValue: boolean) {
  await prisma.problem.update({
    where: { id: problemId },
    data: { is_solved: nextValue },
  });
  revalidatePath('/');
}
