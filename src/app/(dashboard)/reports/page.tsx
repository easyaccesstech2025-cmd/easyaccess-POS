import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { dbPos as db, dbAuth } from "@/lib/db";
import { orders, orderItems, refunds, products, categories, orderItemModifiers } from "@/lib/db/schema";
import { users as schemaUsers } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { ReportsClient } from "@/components/reports/reports-client";

function getDateRange(range: string | undefined, from?: string, to?: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (range) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "this-week":
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case "this-month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "this-year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "all-time":
        startDate = new Date(2000, 0, 1);
        break;
      default: // default to today
        startDate.setHours(0, 0, 0, 0);
        break;
    }
  }
  
  return { startDate, endDate };
}

export default async function ReportsPage(props: { searchParams?: Promise<{ range?: string, from?: string, to?: string }> }) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) return null;
  
  const isIngredientsBased = (session?.user as any)?.companyType?.toLowerCase().includes("ingredients") ?? false;
  
  const searchParams = await props.searchParams;
  const range = searchParams?.range || "today";
  const { startDate, endDate } = getDateRange(range, searchParams?.from, searchParams?.to);
  
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // Fetch data
  const ordersData = await db.select().from(orders).where(
    and(
      eq(orders.userId, userId),
      gte(orders.createdAtMs, startMs),
      lte(orders.createdAtMs, endMs)
    )
  ).orderBy(desc(orders.id));

  const orderIds = ordersData.map(o => o.id);

  const refundsData = await db.select().from(refunds).where(
    and(
      eq(refunds.userId, userId),
      gte(refunds.createdAtMs, startMs),
      lte(refunds.createdAtMs, endMs)
    )
  );

  const { posSessions, cashTransactions } = await import("@/lib/db/schema");
  
  const sessionsData = await db.select().from(posSessions).where(
    and(
      eq(posSessions.userId, userId),
      gte(posSessions.openedAtMs, startMs),
      lte(posSessions.openedAtMs, endMs)
    )
  ).orderBy(desc(posSessions.id));
  
  const sessionIds = sessionsData.map(s => s.id);
  let cashTxData: any[] = [];
  if (sessionIds.length > 0) {
    cashTxData = await db.select().from(cashTransactions).where(eq(cashTransactions.userId, userId));
    cashTxData = cashTxData.filter(ct => ct.sessionId && sessionIds.includes(ct.sessionId));
  }

  const refundIds = refundsData.map(r => r.id);
  let refundItemsData: any[] = [];
  if (refundIds.length > 0) {
    const { refundItems } = await import("@/lib/db/schema");
    refundItemsData = await db.select().from(refundItems).where(eq(refundItems.userId, userId));
    refundItemsData = refundItemsData.filter(ri => refundIds.includes(ri.refundId));
  }

  // We only fetch order items for the orders in this range to calculate COGS and categories
  let itemsData: any[] = [];
  if (orderIds.length > 0) {
    itemsData = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      costPrice: orderItems.costPrice,
      recipeCost: orderItems.recipeCost,
      discountPercentage: orderItems.discountPercentage,
      discountType: orderItems.discountType,
      discountValue: orderItems.discountValue,
      productName: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(orderItems.userId, userId));
    // Filter in memory for orderIds to avoid huge IN clauses if many orders
    itemsData = itemsData.filter(item => item.orderId && orderIds.includes(item.orderId));
  }

  // Pre-calculate KPIs to send to client
  let grossSales = 0;
  ordersData.forEach(o => grossSales += Number(o.totalAmount));

  let totalRefunds = 0;
  refundsData.forEach(r => totalRefunds += Number(r.totalRefunded));

  const netSales = grossSales - totalRefunds;

  let cogs = 0;
  itemsData.forEach(item => {
    // COGS = SUM(Quantity * COALESCE(Recipe Cost, Cost Price))
    const cost = Number(item.recipeCost) || Number(item.costPrice) || 0;
    cogs += (cost * item.quantity);
  });

  const grossProfit = grossSales - cogs;
  const netProfit = grossProfit - totalRefunds;

  // Additional fetch for Sales History
  const cashiersData = await dbAuth.select({ id: schemaUsers.id, name: schemaUsers.fullName }).from(schemaUsers).where(eq(schemaUsers.parentAdminId, userId));
  const adminData = await dbAuth.select({ id: schemaUsers.id, name: schemaUsers.fullName }).from(schemaUsers).where(eq(schemaUsers.id, userId));
  const allUsers = [...cashiersData, ...adminData];

  const itemIds = itemsData.map(i => i.id);
  let modifiersData: any[] = [];
  if (itemIds.length > 0) {
    modifiersData = await db.select().from(orderItemModifiers);
    modifiersData = modifiersData.filter(m => itemIds.includes(m.orderItemId));
  }

  // Fetch Deliveries Data
  const { deliveryLogs, suppliers } = await import("@/lib/db/schema");
  
  const deliveriesData = await db.select({
    id: deliveryLogs.id,
    productId: deliveryLogs.productId,
    supplierId: deliveryLogs.supplierId,
    quantity: deliveryLogs.quantity,
    previousStock: deliveryLogs.previousStock,
    newStock: deliveryLogs.newStock,
    referenceNumber: deliveryLogs.referenceNumber,
    receivedBy: deliveryLogs.receivedBy,
    dateReceivedMs: deliveryLogs.dateReceivedMs,
    notes: deliveryLogs.notes,
    productName: products.name,
    supplierName: suppliers.name
  })
  .from(deliveryLogs)
  .leftJoin(products, eq(deliveryLogs.productId, products.id))
  .leftJoin(suppliers, eq(deliveryLogs.supplierId, suppliers.id))
  .where(
    and(
      eq(deliveryLogs.userId, userId),
      gte(deliveryLogs.dateReceivedMs, startMs),
      lte(deliveryLogs.dateReceivedMs, endMs)
    )
  ).orderBy(desc(deliveryLogs.dateReceivedMs));

  // Fetch Ingredients Data for Loss Math
  const { ingredients, productRecipes, categories: schemaCategories } = await import("@/lib/db/schema");
  let ingredientsData: any[] = [];
  let recipesData: any[] = [];
  let productsList: any[] = [];
  let categoriesList: any[] = [];
  
  if (isIngredientsBased) {
    ingredientsData = await db.select().from(ingredients).where(eq(ingredients.userId, userId));
    recipesData = await db.select().from(productRecipes).where(eq(productRecipes.userId, userId));
  }
  
  productsList = await db.select({ 
    id: products.id, 
    name: products.name, 
    price: products.price, 
    costPrice: products.costPrice,
    stock: products.stock,
    categoryId: products.categoryId
  }).from(products).where(eq(products.userId, userId));

  categoriesList = await db.select().from(schemaCategories).where(eq(schemaCategories.userId, userId));

  const { ingredientReconciliations, ingredientReconciliationItems } = await import("@/lib/db/schema");
  const reconciliations = await db.select().from(ingredientReconciliations).where(
    and(
      eq(ingredientReconciliations.userId, userId),
      gte(ingredientReconciliations.createdAtMs, startMs),
      lte(ingredientReconciliations.createdAtMs, endMs)
    )
  ).orderBy(desc(ingredientReconciliations.createdAtMs));
  
  const reconIds = reconciliations.map(r => r.id);
  let reconItems: any[] = [];
  if (reconIds.length > 0) {
    reconItems = await db.select().from(ingredientReconciliationItems);
    reconItems = reconItems.filter(ri => reconIds.includes(ri.reconciliationId));
  }

  return (
    <div className="space-y-6">
      <ReportsClient 
        isIngredientsBased={isIngredientsBased}
        currentRange={range}
        startDateStr={startDate.toISOString()}
        endDateStr={endDate.toISOString()}
        kpis={{
          grossSales,
          netSales,
          totalRefunds,
          cogs,
          grossProfit,
          netProfit,
          transactionCount: ordersData.length
        }}
        itemsData={itemsData}
        ordersData={ordersData}
        modifiersData={modifiersData}
        usersData={allUsers}
        refundsData={refundsData}
        refundItemsData={refundItemsData}
        sessionsData={sessionsData}
        cashTxData={cashTxData}
        deliveriesData={deliveriesData}
        ingredientsData={ingredientsData}
        recipesData={recipesData}
        productsList={productsList}
        categoriesList={categoriesList}
        reconciliations={reconciliations}
        reconItems={reconItems}
      />
    </div>
  );
}
