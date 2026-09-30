import { dbAuth, dbPos as db } from "../src/lib/db/index";
import { users as authUsers } from "../src/lib/db/schema";
import { posSessions, cashTransactions, orders, refunds } from "../src/lib/db/schema";

async function main() {
  const admin = await dbAuth.select().from(authUsers).limit(1);
  if (admin.length === 0) throw new Error("No admin found.");
  const userId = admin[0].id;

  // Insert Session
  const sessionRes = await db.insert(posSessions).values({
    userId,
    openedBy: userId,
    openedAtMs: 1704067200000,
    closedAtMs: null, // Keep it OPEN for the dashboard to show it!
    startingCash: "2000.00",
    status: "OPEN"
  }).returning();
  
  const sessionId = sessionRes[0].id;

  // Insert Transactions
  await db.insert(cashTransactions).values([
    {
      sessionId,
      userId,
      transactionType: "CASH_ADDED",
      amount: "500.00",
      description: "Additional change / float from owner",
      createdAtMs: 1704081600000
    },
    {
      sessionId,
      userId,
      transactionType: "EXPENSE",
      amount: "250.00",
      description: "Store cleaning supplies",
      createdAtMs: 1704085200000
    }
  ]);

  // Insert Orders
  await db.insert(orders).values([
    {
      sessionId,
      userId,
      cashierId: userId,
      totalAmount: "300.00",
      paymentMethod: "CASH",
      deliveryFee: "20.00",
      serviceFee: "0.00",
      createdAtMs: 1704070800000
    },
    {
      sessionId,
      userId,
      cashierId: userId,
      totalAmount: "450.00",
      paymentMethod: "DIGITAL",
      splitDigitalMethod: "GCash",
      deliveryFee: "0.00",
      serviceFee: "10.00",
      createdAtMs: 1704074400000
    },
    {
      sessionId,
      userId,
      cashierId: userId,
      totalAmount: "500.00",
      paymentMethod: "SPLIT",
      splitCashAmount: "200.00",
      splitDigitalAmount: "300.00",
      splitDigitalMethod: "Card",
      deliveryFee: "0.00",
      serviceFee: "0.00",
      createdAtMs: 1704088800000
    },
    {
      sessionId,
      userId,
      cashierId: userId,
      totalAmount: "150.00",
      paymentMethod: "CASH",
      deliveryFee: "0.00",
      serviceFee: "0.00",
      createdAtMs: 1704096000000
    }
  ]);

  // Insert Refund
  // Assuming a random order_id is needed, wait refunds table requires orderId!
  // I will just put orderId: 1 for mock data. Wait, I should get one of the orders I just inserted.
  const orderRes = await db.select().from(orders).limit(1);
  const mockOrderId = orderRes.length > 0 ? orderRes[0].id : 1;

  await db.insert(refunds).values({
    sessionId,
    userId,
    orderId: mockOrderId,
    cashierId: userId,
    refundReason: "Customer request",
    totalRefunded: "100.00",
    deliveryFeeRefunded: "0.00",
    serviceFeeRefunded: "0.00",
    createdAtMs: 1704099600000
  });

  console.log("MOCK DATA SEEDED SUCCESSFULLY!");
}

main().catch(console.error);


