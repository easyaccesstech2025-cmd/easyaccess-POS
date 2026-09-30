"use server";

import { dbPos } from "@/lib/db";
import { products, supplierProductPrices, productRecipes } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createProductAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const name = formData.get("name")?.toString().trim();
  const price = Number(formData.get("price"));
  if (!name || isNaN(price)) return { error: "Name and Price are required." };

  const costPrice = Number(formData.get("costPrice")) || 0;
  const isRecipe = formData.get("isRecipe") === "true";
  const stock = isRecipe ? 0 : (Number(formData.get("stock")) || 0);
  const barcode = formData.get("barcode")?.toString().trim() || null;
  const brandName = formData.get("brandName")?.toString().trim() || null;
  const trackExpiry = formData.get("trackExpiry") === "true";
  const backgroundColor = formData.get("backgroundColor")?.toString() || "#FD6708";
  
  const categoryIdStr = formData.get("categoryId")?.toString();
  const categoryId = categoryIdStr && categoryIdStr !== "none" ? parseInt(categoryIdStr) : null;
  
  const supplierIdStr = formData.get("supplierId")?.toString();
  const supplierId = supplierIdStr && supplierIdStr !== "none" ? parseInt(supplierIdStr) : null;

  // Handle Image Base64 String
  const imageBase64 = formData.get("imageBase64")?.toString();
  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, "base64");
  }

  // Handle Recipe Items
  const recipeItemsRaw = formData.get("recipeItems")?.toString();
  let recipeItems: { ingredientId: number, quantityRequired: number }[] = [];
  if (isRecipe && recipeItemsRaw) {
    try {
      recipeItems = JSON.parse(recipeItemsRaw);
    } catch (e) {}
  }

  try {
    // 1. Duplicate check
    const existing = await dbPos.select({ id: products.id }).from(products)
      .where(and(eq(products.userId, userId), ilike(products.name, name))).limit(1);
    
    if (existing.length > 0) return { error: `A product named "${name}" already exists.` };

    // 2. Insert Product
    const [newProduct] = await dbPos.insert(products).values({
      userId,
      name,
      price: price.toString(),
      costPrice: costPrice.toString(),
      stock,
      categoryId,
      supplierId,
      barcode,
      brandName,
      trackExpiry,
      isRecipe,
      backgroundColor,
      imageData: imageBuffer as any,
      updatedAtMs: Date.now(),
      isArchived: false,
    }).returning({ id: products.id });

    // 3. Secondary batch inserts
    const batchQueries: any[] = [];

    // 3a. Supplier Price Memory
    if (supplierId) {
      batchQueries.push(
        dbPos.insert(supplierProductPrices).values({
          supplierId,
          productId: newProduct.id,
          userId,
          costPrice: costPrice.toString(),
          updatedAtMs: Date.now(),
        })
      );
    }

    // 3b. Recipe Ingredients
    if (isRecipe && recipeItems.length > 0) {
      const inserts = recipeItems.map(item => ({
        productId: newProduct.id,
        ingredientId: item.ingredientId,
        userId,
        quantityRequired: item.quantityRequired.toString(),
      }));
      batchQueries.push(dbPos.insert(productRecipes).values(inserts));
    }

    if (batchQueries.length > 0) {
      await dbPos.batch(batchQueries as [any, ...any[]]);
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { error: `Server Error: ${error?.message || String(error)}` };
  }
}

export async function editProductAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const productId = parseInt(formData.get("productId")?.toString() || "0");
  if (!productId) return { error: "Product ID is missing." };

  const name = formData.get("name")?.toString().trim();
  const price = Number(formData.get("price"));
  if (!name || isNaN(price)) return { error: "Name and Price are required." };

  const costPrice = Number(formData.get("costPrice")) || 0;
  const stock = Number(formData.get("stock")) || 0;
  const barcode = formData.get("barcode")?.toString().trim() || null;
  const brandName = formData.get("brandName")?.toString().trim() || null;
  const trackExpiry = formData.get("trackExpiry") === "true";
  const backgroundColor = formData.get("backgroundColor")?.toString() || "#FD6708";
  
  const categoryIdStr = formData.get("categoryId")?.toString();
  const categoryId = categoryIdStr && categoryIdStr !== "none" ? parseInt(categoryIdStr) : null;
  
  const supplierIdStr = formData.get("supplierId")?.toString();
  const supplierId = supplierIdStr && supplierIdStr !== "none" ? parseInt(supplierIdStr) : null;

  // Handle Image Base64 String (Only update if a new one was provided)
  const imageBase64 = formData.get("imageBase64")?.toString();
  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, "base64");
  }

  try {
    // 1. Fetch existing product to check stock changes
    const [existing] = await dbPos.select().from(products).where(and(eq(products.id, productId), eq(products.userId, userId)));
    if (!existing) return { error: "Product not found." };

    const recipeItemsStr = formData.get("recipeItems")?.toString();
    const recipeItems = recipeItemsStr ? JSON.parse(recipeItemsStr) : null;
    // Fix for older Android products: if they send recipe items, it's a recipe regardless of the DB flag
    const isActuallyRecipe = existing.isRecipe || (recipeItems && recipeItems.length > 0);

    // 2. Prepare Update Payload
    const updatePayload: any = {
      name,
      price: price.toString(),
      costPrice: isActuallyRecipe ? existing.costPrice : costPrice.toString(),
      stock: isActuallyRecipe ? existing.stock : stock, // Never allow manual stock if it's a recipe
      isRecipe: isActuallyRecipe, // Force fix the flag in the database if it was wrong
      categoryId,
      supplierId,
      barcode,
      brandName,
      trackExpiry,
      backgroundColor,
      updatedAtMs: Date.now(),
      lastAction: "Manual Edit"
    };
    if (imageBuffer) updatePayload.imageData = imageBuffer as any;

    const batchQueries: any[] = [];

    // 3. Update Product
    batchQueries.push(
      dbPos.update(products).set(updatePayload).where(and(eq(products.id, productId), eq(products.userId, userId)))
    );

    // 4. Log Inventory Adjustment ONLY if stock actually changed (and it's not a recipe)
    if (!isActuallyRecipe && existing.stock !== stock) {
      const notes = formData.get("adjustmentReason")?.toString().trim() || "Manual adjustment during edit";
      batchQueries.push(
        dbPos.insert(schema.inventoryAdjustments).values({
          productId,
          userId,
          previousStock: existing.stock || 0,
          newStock: stock,
          quantityChanged: stock - (existing.stock || 0),
          dateAdjustedMs: Date.now(),
          notes
        })
      );
    }

    // 5. Update Recipe Items if it's a recipe
    if (isActuallyRecipe && recipeItems) {
      // Wipe old recipe items
      batchQueries.push(
          dbPos.delete(schema.productRecipes).where(and(eq(schema.productRecipes.productId, productId), eq(schema.productRecipes.userId, userId)))
        );
        
        // Insert new ones
        const validItems = recipeItems.filter((i: any) => i.ingredientId && i.quantityRequired);
        if (validItems.length > 0) {
          const inserts = validItems.map((item: any) => ({
            productId,
            userId,
            ingredientId: parseInt(item.ingredientId),
            quantityRequired: item.quantityRequired.toString()
          }));
          batchQueries.push(dbPos.insert(schema.productRecipes).values(inserts));
        }
    }

    await dbPos.batch(batchQueries as [any, ...any[]]);
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit product:", error);
    return { error: error.message || "Failed to save changes." };
  }
}

export async function receiveProductDeliveryAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  const productId = parseInt(formData.get("productId")?.toString() || "0");
  const quantity = Number(formData.get("quantity"));
  
  if (!productId || isNaN(quantity) || quantity <= 0) {
    return { error: "Valid product and quantity are required." };
  }

  const supplierIdStr = formData.get("supplierId")?.toString();
  const supplierId = supplierIdStr && supplierIdStr !== "none" ? parseInt(supplierIdStr) : null;
  const referenceNumber = formData.get("referenceNumber")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;
  const receivedBy = session.user.name || "Unknown User";

  try {
    const [existing] = await dbPos.select({ stock: products.stock, isRecipe: products.isRecipe }).from(products).where(and(eq(products.id, productId), eq(products.userId, userId)));
    if (!existing) return { error: "Product not found." };
    if (existing.isRecipe) return { error: "Cannot receive delivery for a recipe-based product." };

    const previousStock = existing.stock || 0;
    const newStock = previousStock + quantity;

    await dbPos.batch([
      dbPos.insert(schema.deliveryLogs).values({
        productId,
        userId,
        supplierId,
        quantity,
        previousStock,
        newStock,
        referenceNumber,
        receivedBy,
        notes,
        dateReceivedMs: Date.now(),
      }),
      dbPos.update(products).set({
        stock: newStock,
        updatedAtMs: Date.now(),
        lastAction: "Delivery Received"
      }).where(and(eq(products.id, productId), eq(products.userId, userId)))
    ]);

    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to receive delivery:", error);
    return { error: "Failed to log delivery." };
  }
}

export async function toggleProductArchiveAction(productId: number, isArchived: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbPos.update(products).set({ 
      isArchived, 
      updatedAtMs: Date.now(),
      lastAction: isArchived ? "Archived" : "Restored"
    }).where(and(eq(products.id, productId), eq(products.userId, userId)));
    
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Archive error:", error);
    return { error: "Failed to update archive status." };
  }
}
