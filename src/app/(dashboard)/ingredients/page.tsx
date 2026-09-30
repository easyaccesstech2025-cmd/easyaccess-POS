import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import { dbPos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { IngredientsHeader } from "@/components/ingredients/ingredients-header";
import { IngredientActionsMenu } from "@/components/ingredients/ingredient-actions-menu";

export default async function IngredientsPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = parseInt(session.user.id);

  // Build query conditions
  const conditions = [eq(schema.ingredients.userId, userId)];
  if (q) {
    conditions.push(ilike(schema.ingredients.name, `%${q}%`));
  }

  // Fetch real data
  const ingredientsData = await dbPos
    .select()
    .from(schema.ingredients)
    .where(and(...conditions))
    .orderBy(schema.ingredients.name);

  // Calculate live statistics
  const totalIngredients = ingredientsData.filter(i => !i.isArchived).length;
  
  // Low Stock Alerts logic for Ingredients: stock <= reorderLevel
  const lowStockCount = ingredientsData.filter(
    i => !i.isArchived && Number(i.stock) <= Number(i.reorderLevel)
  ).length;

  const totalValue = ingredientsData
    .filter(i => !i.isArchived && Number(i.stock) > 0)
    .reduce((sum, i) => sum + (Number(i.stock) * Number(i.costPerUnit)), 0);

  return (
    <div className="space-y-6">
      <IngredientsHeader ingredients={ingredientsData} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Ingredients</div>
            <div className="text-3xl font-bold">{totalIngredients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Low Stock Alerts</div>
            <div className="text-3xl font-bold text-red-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Value</div>
            <div className="text-3xl font-bold">{formatPeso(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Cost / Unit</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredientsData.map((ing) => {
              const stock = Number(ing.stock);
              const reorder = Number(ing.reorderLevel);
              const isAlert = stock <= reorder;

              return (
                <TableRow 
                  key={ing.id} 
                  className={ing.isArchived ? "bg-gray-50/50 [&>td:not(:last-child)]:opacity-50" : ""}
                >
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell>{ing.unitOfMeasurement}</TableCell>
                  <TableCell>
                    <span className={isAlert ? "text-red-600 font-medium" : ""}>
                      {stock} {ing.unitOfMeasurement}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatPeso(Number(ing.costPerUnit))} / {ing.unitOfMeasurement}
                  </TableCell>
                  <TableCell>{reorder} {ing.unitOfMeasurement}</TableCell>
                  <TableCell>
                    {ing.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : isAlert ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Good</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <IngredientActionsMenu ingredient={ing} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
