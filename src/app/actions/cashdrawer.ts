"use server";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

import { posSessions, cashTransactions, orders, refunds } from "@/lib/db/schema";
import { dbPos } from "@/lib/db/index";
import { auth } from "@/lib/auth";

export async function openShiftAction(startingCash: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);
  const parentAdminId = (session.user as any).parentAdminId || userId;

  try {
    const existing = await dbPos.select().from(posSessions)
      .where(and(eq(posSessions.userId, parentAdminId), eq(posSessions.status, 'OPEN')));
    
    if (existing.length > 0) return { error: "A shift is already open." };

    await dbPos.insert(posSessions).values({
      userId: parentAdminId,
      openedBy: userId,
      openedAtMs: Date.now(),
      startingCash: startingCash.toString(),
      status: "OPEN"
    });

    revalidatePath("/cashdrawer");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function closeShiftAction(sessionId: number, actualCashCounted: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parentAdminId = (session.user as any).parentAdminId || parseInt(session.user.id);

  try {
    await dbPos.update(posSessions)
      .set({
        status: "CLOSED",
        closedAtMs: Date.now(),
        actualCashCounted: actualCashCounted.toString()
      })
      .where(and(eq(posSessions.id, sessionId), eq(posSessions.userId, parentAdminId)));

    revalidatePath("/cashdrawer");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function addCashTransactionAction(sessionId: number, type: 'CASH_ADDED' | 'EXPENSE', amount: number, description: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parentAdminId = (session.user as any).parentAdminId || parseInt(session.user.id);

  try {
    await dbPos.insert(cashTransactions).values({
      sessionId,
      userId: parentAdminId,
      transactionType: type,
      amount: amount.toString(),
      description,
      createdAtMs: Date.now()
    });

    revalidatePath("/cashdrawer");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}



