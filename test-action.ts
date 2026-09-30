import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/lib/db/schema";
import fs from "fs";
import { eq, and } from "drizzle-orm";

const env = fs.readFileSync(".env", "utf8");
const dbUrl = env.split("\n").find(line => line.startsWith("DATABASE_URL_POS="))?.split("=")[1].replace(/"/g, "");

async function testAction() {
  const sql = neon(dbUrl!);
  const dbPos = drizzle(sql, { schema });
  const userId = 32;
  const productId = 15; // Cappuccino L Hot
  
  const [existing] = await dbPos.select().from(schema.products).where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));
  console.log("Existing product:", existing.name, "isRecipe:", existing.isRecipe);
  
  const recipeItems = [
    { ingredientId: 6, quantityRequired: "1" },
    { ingredientId: 7, quantityRequired: "25" }
  ];
  const isActuallyRecipe = existing.isRecipe || (recipeItems && recipeItems.length > 0);

  const updatePayload: any = {
    name: existing.name,
    price: existing.price.toString(),
    costPrice: isActuallyRecipe ? existing.costPrice : "0",
    stock: isActuallyRecipe ? existing.stock : existing.stock, 
    isRecipe: isActuallyRecipe,
    categoryId: existing.categoryId,
    supplierId: existing.supplierId,
    barcode: existing.barcode,
    trackExpiry: existing.trackExpiry,
    backgroundColor: existing.backgroundColor,
    updatedAtMs: Date.now(),
    lastAction: "Manual Edit"
  };

  const batchQueries: any[] = [];
  batchQueries.push(
    dbPos.update(schema.products).set(updatePayload).where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)))
  );

  if (isActuallyRecipe && recipeItems) {
    batchQueries.push(
      dbPos.delete(schema.productRecipes).where(and(eq(schema.productRecipes.productId, productId), eq(schema.productRecipes.userId, userId)))
    );
    const validItems = recipeItems.filter((i: any) => i.ingredientId && i.quantityRequired);
    if (validItems.length > 0) {
      const inserts = validItems.map((item: any) => ({
        productId,
        userId,
        ingredientId: item.ingredientId,
        quantityRequired: item.quantityRequired.toString()
      }));
      batchQueries.push(dbPos.insert(schema.productRecipes).values(inserts));
    }
  }

  try {
    await dbPos.batch(batchQueries as [any, ...any[]]);
    console.log("Success!");
  } catch (error) {
    console.error("DB Error:", error);
  }
}

testAction().catch(console.error);
