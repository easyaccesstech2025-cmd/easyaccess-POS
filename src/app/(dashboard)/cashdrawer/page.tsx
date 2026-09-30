import { auth } from "@/lib/auth";
import { posSessions, cashTransactions, orders, refunds } from "@/lib/db/schema";
import { dbPos, dbAuth } from "@/lib/db/index";
import { users as authUsers } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CashDrawerClient } from "@/components/cashdrawer/cashdrawer-client";
import { redirect } from "next/navigation";

export default async function CashDrawerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = parseInt(session.user.id!);
  const parentAdminId = (session.user as any).parentAdminId || userId;

  // Get active session
  const activeSessionRows = await dbPos.select().from(posSessions)
    .where(and(eq(posSessions.userId, parentAdminId), eq(posSessions.status, 'OPEN')))
    .orderBy(desc(posSessions.id))
    .limit(1);

  let activeSession = activeSessionRows[0] || null;

  // If there is an active session, fetch its transactions, sales, and refunds to do the math
  let shiftTransactions: any[] = [];
  let shiftOrders: any[] = [];
  let shiftRefunds: any[] = [];
  let openedByName = "Unknown";

  if (activeSession) {
    shiftTransactions = await dbPos.select().from(cashTransactions).where(eq(cashTransactions.sessionId, activeSession.id)).orderBy(desc(cashTransactions.createdAtMs));
    shiftOrders = await dbPos.select().from(orders).where(eq(orders.sessionId, activeSession.id));
    shiftRefunds = await dbPos.select().from(refunds).where(eq(refunds.sessionId, activeSession.id));
    const userResult = await dbAuth.select().from(authUsers).where(eq(authUsers.id, activeSession.openedBy as number));
    if (userResult.length > 0) openedByName = userResult[0].fullName || userResult[0].username;
  }

  // Also get the last 5 closed sessions for history
  const historySessions = await dbPos.select().from(posSessions)
    .where(and(eq(posSessions.userId, parentAdminId), eq(posSessions.status, 'CLOSED')))
    .orderBy(desc(posSessions.closedAtMs))
    .limit(5);

  return (
    <CashDrawerClient 
      activeSession={activeSession} 
      transactions={shiftTransactions} 
      orders={shiftOrders} 
      refunds={shiftRefunds}
      history={historySessions} openedByName={openedByName}
    />
  );
}







