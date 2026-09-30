"use server";

import { dbPos } from "@/lib/db";
import { ingredients, ingredientReconciliations, ingredientReconciliationItems, ingredientAdjustments } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReconciliationAction(data: {
  notes: string;
  updateStock: boolean;
  items: { ingredientId: number; actualStock: number }[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  
  const userId = parseInt(session.user.id);
  const performedBy = userId;
  const now = Date.now();

  try {
    const ingredientIds = data.items.map(i => i.ingredientId);
    if (ingredientIds.length === 0) return { error: "No items to reconcile." };

    // 1. Fetch current system stock for all submitted ingredients securely
    const currentIngredients = await dbPos
      .select({ id: ingredients.id, stock: ingredients.stock, costPerUnit: ingredients.costPerUnit })
      .from(ingredients)
      .where(and(eq(ingredients.userId, userId), inArray(ingredients.id, ingredientIds)));

    const currentMap = new Map(currentIngredients.map(i => [i.id, i]));

    // 2. Insert master row to get ID (Required step 1 for Neon HTTP stateless batches)
    const [masterRow] = await dbPos.insert(ingredientReconciliations).values({
      userId,
      performedBy,
      createdAtMs: now,
      notes: data.notes || "End of Day Count",
    }).returning({ id: ingredientReconciliations.id });

    const reconId = masterRow.id;

    // 3. Prepare massive batch array
    const batchQueries: any[] = [];

    for (const item of data.items) {
      const dbIng = currentMap.get(item.ingredientId);
      if (!dbIng) continue;

      const systemStock = Number(dbIng.stock);
      const costPerUnit = Number(dbIng.costPerUnit);
      const actualStock = item.actualStock;
      
      const variance = systemStock - actualStock;
      const varianceCost = variance * costPerUnit;

      // Insert item log (Always happens)
      batchQueries.push(
        dbPos.insert(ingredientReconciliationItems).values({
          reconciliationId: reconId,
          ingredientId: item.ingredientId,
          systemStock: systemStock.toString(),
          actualStock: actualStock.toString(),
          variance: variance.toString(),
          varianceCost: varianceCost.toString(),
        })
      );

      // Update stock & log adjustment (Only if checked & variance exists)
      if (data.updateStock && variance !== 0) {
        batchQueries.push(
          dbPos.update(ingredients).set({
            stock: actualStock,
            updatedAtMs: now,
            lastAction: "Reconciliation"
          }).where(and(eq(ingredients.id, item.ingredientId), eq(ingredients.userId, userId)))
        );

        batchQueries.push(
          dbPos.insert(ingredientAdjustments).values({
            ingredientId: item.ingredientId,
            userId,
            previousStock: systemStock.toString(),
            newStock: actualStock.toString(),
            quantityChanged: (-variance).toString(), // mathematically actual - system
            dateAdjustedMs: now,
            notes: `Reconciliation Update (Recon ID: ${reconId})`
          })
        );
      }
    }

    // 4. Execute the massive batch transaction
    if (batchQueries.length > 0) {
      await dbPos.batch(batchQueries as [any, ...any[]]);
    }

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error: any) {
    console.error("Reconciliation failed:", error);
    return { error: error.message || "Failed to submit end of day count." };
  }
}
