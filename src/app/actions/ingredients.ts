"use server";

import { dbPos } from "@/lib/db";
import { ingredients, ingredientAdjustments, ingredientDeliveryLogs } from "@/lib/db/schema";
import { eq, and, ilike, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper to authenticate
async function getAuthContext() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return parseInt(session.user.id);
}

export async function createIngredientAction(prevState: any, formData: FormData) {
  const userId = await getAuthContext();

  const name = formData.get("name")?.toString().trim();
  const uomSelection = formData.get("uom")?.toString().trim();
  const customUom = formData.get("customUom")?.toString().trim();
  const stock = Number(formData.get("stock")) || 0.0;
  const cost = Number(formData.get("cost")) || 0.0;
  const reorderLevel = Number(formData.get("reorderLevel")) || 0.0;

  const finalUom = uomSelection === "other" ? customUom : uomSelection;

  if (!name || !finalUom) {
    return { error: "Name and Unit of Measurement are required." };
  }

  try {
    const existing = await dbPos
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(and(eq(ingredients.userId, userId), ilike(ingredients.name, name)))
      .limit(1);

    if (existing.length > 0) {
      return { error: `An ingredient named "${name}" already exists in your list.` };
    }

    await dbPos.insert(ingredients).values({
      userId,
      name,
      unitOfMeasurement: finalUom,
      stock: stock,
      costPerUnit: cost.toString(),
      reorderLevel: reorderLevel,
      isArchived: false,
      updatedAtMs: Date.now(),
    });

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error) {
    return { error: "Internal server error. Please try again." };
  }
}

export async function editIngredientAction(prevState: any, formData: FormData) {
  try {
    const userId = await getAuthContext();
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name")?.toString().trim();
    const uomSelection = formData.get("uom")?.toString().trim();
    const customUom = formData.get("customUom")?.toString().trim();
    const cost = Number(formData.get("cost")) || 0.0;
    const reorderLevel = Number(formData.get("reorderLevel")) || 0.0;

    const finalUom = uomSelection === "other" ? customUom : uomSelection;

    if (!id || !name || !finalUom) {
      return { error: "Name and Unit of Measurement are required." };
    }

    // Check duplicates, excluding self
    const existing = await dbPos
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(and(
        eq(ingredients.userId, userId), 
        ilike(ingredients.name, name),
        ne(ingredients.id, id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { error: `Another ingredient named "${name}" already exists.` };
    }

    // Notice we DO NOT update stock here. Stock is strictly updated via Adjust/Receive.
    await dbPos.update(ingredients).set({
      name,
      unitOfMeasurement: finalUom,
      costPerUnit: cost.toString(),
      reorderLevel,
      updatedAtMs: Date.now(),
    }).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)));

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update ingredient." };
  }
}

export async function adjustStockAction(prevState: any, formData: FormData) {
  try {
    const userId = await getAuthContext();
    const id = parseInt(formData.get("id") as string);
    const newStock = Number(formData.get("newStock"));
    const notes = formData.get("notes")?.toString().trim();

    if (isNaN(id) || isNaN(newStock) || !notes) {
      return { error: "New stock and adjustment notes are required." };
    }

    const current = await dbPos.select({ stock: ingredients.stock })
      .from(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .limit(1);

    if (current.length === 0) throw new Error("Ingredient not found");
    const previousStock = Number(current[0].stock);
    const qtyChanged = newStock - previousStock;

    if (qtyChanged === 0) throw new Error("No change in stock amount");

    const now = Date.now();

    await dbPos.batch([
      dbPos.update(ingredients).set({
        stock: newStock,
        updatedAtMs: now,
        lastAction: 'Manual Adjustment'
      }).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId))),

      dbPos.insert(ingredientAdjustments).values({
        ingredientId: id,
        userId,
        previousStock: previousStock.toString(),
        newStock: newStock.toString(),
        quantityChanged: qtyChanged.toString(),
        dateAdjustedMs: now,
        notes,
      })
    ]);

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to adjust stock." };
  }
}

export async function receiveDeliveryAction(prevState: any, formData: FormData) {
  try {
    const userId = await getAuthContext();
    const id = parseInt(formData.get("id") as string);
    const quantity = Number(formData.get("quantity"));
    const cost = Number(formData.get("cost"));
    const referenceNumber = formData.get("referenceNumber")?.toString().trim();
    const receivedBy = formData.get("receivedBy")?.toString().trim();
    const notes = formData.get("notes")?.toString().trim();

    if (isNaN(id) || isNaN(quantity) || quantity <= 0) {
      return { error: "A valid positive delivery quantity is required." };
    }

    const current = await dbPos.select({ stock: ingredients.stock, cost: ingredients.costPerUnit })
      .from(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .limit(1);

    if (current.length === 0) throw new Error("Ingredient not found");
    const previousStock = Number(current[0].stock);
    const newStock = previousStock + quantity;
    
    // If user provided a new cost, use it, else keep old cost
    const finalCost = !isNaN(cost) ? cost.toString() : current[0].cost;
    const now = Date.now();

    await dbPos.batch([
      dbPos.update(ingredients).set({
        stock: newStock,
        costPerUnit: finalCost,
        updatedAtMs: now,
        lastAction: 'Delivery Received'
      }).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId))),

      dbPos.insert(ingredientDeliveryLogs).values({
        ingredientId: id,
        userId,
        quantity: quantity.toString(),
        previousStock: previousStock.toString(),
        newStock: newStock.toString(),
        costPerUnit: finalCost,
        referenceNumber,
        receivedBy,
        dateReceivedMs: now,
        notes,
      })
    ]);

    revalidatePath("/ingredients");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to receive delivery." };
  }
}

export async function toggleArchiveIngredientAction(id: number, currentStatus: boolean) {
  try {
    const userId = await getAuthContext();
    await dbPos.update(ingredients)
      .set({ isArchived: !currentStatus, updatedAtMs: Date.now() })
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)));
    
    revalidatePath("/ingredients");
    return { success: true };
  } catch (error) {
    return { error: "Failed to archive ingredient." };
  }
}
