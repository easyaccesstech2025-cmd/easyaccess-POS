import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { formatPeso, cn } from "@/lib/utils";
import { dbPos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, sql, and, ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ProductsHeader } from "@/components/products/products-header";
import { ModifiersTab } from "@/components/products/modifiers-tab";
import { ProductsTable } from "@/components/products/products-table";

export default async function ProductsPage(props: {
  searchParams?: Promise<{ q?: string, tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = parseInt(session.user.id);

  // Fetch lookup data for the Add Product modal
  const categoriesData = await dbPos.select().from(schema.categories).where(eq(schema.categories.userId, userId));
  const suppliersData = await dbPos.select().from(schema.suppliers).where(eq(schema.suppliers.userId, userId));
  const ingredientsData = await dbPos.select().from(schema.ingredients).where(and(eq(schema.ingredients.userId, userId), eq(schema.ingredients.isArchived, false))).orderBy(schema.ingredients.name);

  // Build query conditions
  const conditions = [eq(schema.products.userId, userId)];
  if (q) {
    conditions.push(
      or(
        ilike(schema.products.name, `%${q}%`),
        ilike(schema.products.barcode, `%${q}%`)
      )!
    );
  }

  // Replicating the exact Android query logic
  const productsData = await dbPos
    .select({
      id: schema.products.id,
      name: schema.products.name,
      price: schema.products.price,
      costPrice: schema.products.costPrice,
      stock: schema.products.stock,
      backgroundColor: schema.products.backgroundColor,
      isArchived: schema.products.isArchived,
      isRecipe: schema.products.isRecipe,
      categoryId: schema.products.categoryId,
      supplierId: schema.products.supplierId,
      categoryName: schema.categories.name,
      supplierName: schema.suppliers.name,
      trackExpiry: schema.products.trackExpiry,
      barcode: schema.products.barcode,
      hasImage: sql<boolean>`octet_length(${schema.products.imageData}) > 0`,
      hasIngredients: sql<boolean>`EXISTS(SELECT 1 FROM product_recipes pr WHERE pr.product_id = ${schema.products.id})`,
      hasModifiers: sql<boolean>`EXISTS(SELECT 1 FROM product_modifier_groups pmg WHERE pmg.product_id = ${schema.products.id})`,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .leftJoin(schema.suppliers, eq(schema.products.supplierId, schema.suppliers.id))
    .where(and(...conditions))
    .orderBy(schema.products.name);

  // Fetch all recipes to pass down into the Edit Modal
  const allRecipes = await dbPos.select().from(schema.productRecipes).where(eq(schema.productRecipes.userId, userId));

  const enrichedProducts = productsData.map(p => ({
    ...p,
    // Fix for older Android products: Treat as a recipe if it has ingredients, even if the is_recipe flag is false
    isRecipe: p.isRecipe || p.hasIngredients,
    recipeItems: allRecipes.filter(r => r.productId === p.id)
  }));

  const tab = searchParams?.tab || "products";

  // Calculate live KPI statistics (in-memory, matching Android POS logic)
  const activeProducts = enrichedProducts.filter(p => !p.isArchived);
  
  const totalProducts = activeProducts.length;
  const totalStock = activeProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  
  const lowStockCount = activeProducts.filter(p => Number(p.stock) >= 1 && Number(p.stock) <= 9 && !p.hasIngredients).length;
  const outOfStockCount = activeProducts.filter(p => Number(p.stock) === 0 && !p.hasIngredients).length;
  const negativeStockCount = activeProducts.filter(p => Number(p.stock) < 0 && !p.hasIngredients).length;

  // Fetch Modifiers Data
  const modifierGroupsData = await dbPos.select().from(schema.modifierGroups).where(and(eq(schema.modifierGroups.userId, userId), eq(schema.modifierGroups.isArchived, false)));
  const modifierOptionsData = await dbPos.select().from(schema.modifierOptions).where(eq(schema.modifierOptions.isArchived, false));
  const productModifierGroupsData = await dbPos.select().from(schema.productModifierGroups).where(eq(schema.productModifierGroups.userId, userId));
  
  // Fetch Expiry Data
  const expiryBatchesData = await dbPos.select().from(schema.productExpiryBatch).where(eq(schema.productExpiryBatch.userId, userId));

  const isIngredientsBased = (session?.user as any)?.companyType?.toLowerCase().includes("ingredients") ?? false;

  return (
    <div className="space-y-6">
      {tab === "products" && (
        <ProductsHeader categories={categoriesData} suppliers={suppliersData} ingredients={ingredientsData} isIngredientsBased={isIngredientsBased} />
      )}

      {/* Tabs UI */}
      <div className="flex space-x-1 border-b border-gray-200">
        <a 
          href="/products?tab=products" 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "products" ? "border-[#FD6708] text-[#FD6708]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          Products
        </a>
        <a 
          href="/products?tab=modifiers" 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "modifiers" ? "border-[#FD6708] text-[#FD6708]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          Modifiers
        </a>
      </div>

      {tab === "modifiers" ? (
        <ModifiersTab 
          groups={modifierGroupsData}
          options={modifierOptionsData}
          ingredients={ingredientsData}
          products={enrichedProducts}
          assignments={productModifierGroupsData}
          isIngredientsBased={isIngredientsBased}
        />
      ) : (
        <>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Products</div>
            <div className="text-3xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Stock</div>
            <div className="text-3xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-amber-700 mb-1">Low Stock</div>
            <div className="text-3xl font-bold text-amber-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-red-700 mb-1">Out of Stock</div>
            <div className="text-3xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-purple-700 mb-1">Negative</div>
            <div className="text-3xl font-bold text-purple-600">{negativeStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <ProductsTable
        enrichedProducts={enrichedProducts}
        categoriesData={categoriesData}
        suppliersData={suppliersData}
        ingredientsData={ingredientsData}
        expiryBatchesData={expiryBatchesData}
        isIngredientsBased={isIngredientsBased}
      />
      </>
      )}
    </div>
  );
}
