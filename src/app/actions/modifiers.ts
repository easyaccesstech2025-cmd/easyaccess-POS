"use server";

import { dbPos } from "@/lib/db";
import { modifierGroups, modifierOptions, productModifierGroups, products } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createModifierGroupAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Group name is required." };

  const selectionType = formData.get("selectionType")?.toString() || "SINGLE";
  const isRequired = formData.get("isRequired") === "true";

  // Since the UI doesn't explicitly ask for min/max to keep things friendly, we hardcode sensible defaults:
  // If Multiple Choice + Required -> Must pick at least 1, unlimited max. Otherwise 0.
  const minSelect = (selectionType === "MULTIPLE" && isRequired) ? 1 : 0;
  const maxSelect = 0; // 0 typically means unlimited for Multiple Choice
  
  const optionsStr = formData.get("options")?.toString();
  if (!optionsStr) return { error: "At least one option is required." };

  const options = JSON.parse(optionsStr);
  if (options.length === 0) return { error: "At least one option is required." };

  try {
    const [newGroup] = await dbPos.insert(modifierGroups).values({
      userId,
      name,
      selectionType,
      isRequired,
      minSelect: selectionType === "SINGLE" ? 0 : minSelect,
      maxSelect: selectionType === "SINGLE" ? 0 : maxSelect,
      sortOrder: 0,
      isArchived: false,
    }).returning({ id: modifierGroups.id });

    const optionInserts = options.map((opt: any, index: number) => ({
      groupId: newGroup.id,
      name: opt.name,
      additionalPrice: opt.additionalPrice.toString(),
      ingredientId: opt.ingredientId ? parseInt(opt.ingredientId) : null,
      quantityRequired: opt.ingredientId && opt.quantityRequired ? opt.quantityRequired.toString() : null,
      isDefault: opt.isDefault || false,
      sortOrder: index,
      isArchived: false,
    }));

    await dbPos.insert(modifierOptions).values(optionInserts);

    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create modifier group:", error);
    return { error: error.message || "Failed to create modifier." };
  }
}

export async function editModifierGroupAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const groupId = parseInt(formData.get("groupId")?.toString() || "0");
  if (!groupId) return { error: "Group ID is missing." };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Group name is required." };

  const selectionType = formData.get("selectionType")?.toString() || "SINGLE";
  const isRequired = formData.get("isRequired") === "true";

  const minSelect = (selectionType === "MULTIPLE" && isRequired) ? 1 : 0;
  const maxSelect = 0; 

  const optionsStr = formData.get("options")?.toString();
  if (!optionsStr) return { error: "At least one option is required." };

  const options = JSON.parse(optionsStr);
  if (options.length === 0) return { error: "At least one option is required." };

  try {
    // 1. Update Group
    await dbPos.update(modifierGroups)
      .set({
        name,
        selectionType,
        isRequired,
        minSelect,
        maxSelect,
      })
      .where(and(eq(modifierGroups.id, groupId), eq(modifierGroups.userId, userId)));

    // 2. Wipe existing options
    await dbPos.delete(modifierOptions).where(eq(modifierOptions.groupId, groupId));

    // 3. Re-insert options
    const optionInserts = options.map((opt: any, index: number) => ({
      groupId,
      name: opt.name,
      additionalPrice: opt.additionalPrice.toString(),
      ingredientId: opt.ingredientId ? parseInt(opt.ingredientId) : null,
      quantityRequired: opt.ingredientId && opt.quantityRequired ? opt.quantityRequired.toString() : null,
      isDefault: opt.isDefault || false,
      sortOrder: index,
      isArchived: false,
    }));

    await dbPos.insert(modifierOptions).values(optionInserts);

    // 4. Bump updatedAtMs for all products assigned to this group so the Android POS pulls the changes
    const existingAssignments = await dbPos.select({ productId: productModifierGroups.productId })
      .from(productModifierGroups)
      .where(and(eq(productModifierGroups.groupId, groupId), eq(productModifierGroups.userId, userId)));
    
    if (existingAssignments.length > 0) {
      const pIds = existingAssignments.map(a => a.productId);
      await dbPos.update(products)
        .set({ updatedAtMs: Date.now() })
        .where(and(inArray(products.id, pIds), eq(products.userId, userId)));
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit modifier group:", error);
    return { error: error.message || "Failed to edit modifier." };
  }
}

export async function assignModifierToProductsAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const groupId = parseInt(formData.get("groupId")?.toString() || "0");
  if (!groupId) return { error: "Group ID is missing." };

  const productIdsStr = formData.get("productIds")?.toString();
  if (!productIdsStr) return { error: "No products selected." };

  const productIds = JSON.parse(productIdsStr);

  try {
    // 1. Get existing assignments to bump their timestamps if they get unchecked
    const existingAssignments = await dbPos.select({ productId: productModifierGroups.productId })
      .from(productModifierGroups)
      .where(and(eq(productModifierGroups.groupId, groupId), eq(productModifierGroups.userId, userId)));
    const existingProductIds = existingAssignments.map(a => a.productId);

    // 2. Wipe all existing assignments for this group
    await dbPos.delete(productModifierGroups).where(and(eq(productModifierGroups.groupId, groupId), eq(productModifierGroups.userId, userId)));

    // 3. Insert the new selected ones
    if (productIds.length > 0) {
      const inserts = productIds.map((pId: number) => ({
        groupId,
        productId: pId,
        userId,
        sortOrder: 0
      }));
      await dbPos.insert(productModifierGroups).values(inserts);
    }

    // 4. Bump updatedAtMs for ALL affected products (added or removed)
    const allAffectedProductIds = Array.from(new Set([...existingProductIds, ...productIds]));
    if (allAffectedProductIds.length > 0) {
      const now = Date.now();
      await dbPos.update(products)
        .set({ updatedAtMs: now })
        .where(and(inArray(products.id, allAffectedProductIds), eq(products.userId, userId)));
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to assign modifier:", error);
    return { error: error.message || "Failed to assign modifier." };
  }
}
