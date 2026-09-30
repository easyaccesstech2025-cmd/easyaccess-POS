"use server";

import { dbPos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function toggleProductExpiryTrackingAction(productId: number, trackExpiry: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbPos.update(schema.products)
      .set({ trackExpiry, updatedAtMs: Date.now() })
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));

    revalidatePath("/products");
    revalidatePath("/expiry");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function addExpiryBatchAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const productId = parseInt(formData.get("productId")?.toString() || "0");
  const quantity = parseInt(formData.get("quantity")?.toString() || "0");
  const expiryDate = formData.get("expiryDate")?.toString();
  const notes = formData.get("notes")?.toString() || "";

  if (!productId || !quantity || !expiryDate) {
    return { error: "Missing required fields." };
  }

  try {
    await dbPos.insert(schema.productExpiryBatch).values({
      productId,
      userId,
      quantity,
      expiryDate,
      source: "manual",
      isWrittenOff: 0,
      notes
    });

    revalidatePath("/products");
    revalidatePath("/expiry");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function writeOffExpiryBatchAction(batchId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbPos.update(schema.productExpiryBatch)
      .set({ 
        isWrittenOff: 1, 
        writtenOffAt: new Date() 
      })
      .where(and(eq(schema.productExpiryBatch.id, batchId), eq(schema.productExpiryBatch.userId, userId)));

    revalidatePath("/products");
    revalidatePath("/expiry");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteExpiryBatchAction(batchId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbPos.delete(schema.productExpiryBatch)
      .where(and(eq(schema.productExpiryBatch.id, batchId), eq(schema.productExpiryBatch.userId, userId)));

    revalidatePath("/products");
    revalidatePath("/expiry");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
