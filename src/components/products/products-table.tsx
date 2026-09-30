"use client";

import { useState } from "react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPeso, cn } from "@/lib/utils";
import { ProductActionsMenu } from "./product-actions-menu";
import { EditProductModal } from "./edit-product-modal";
import { ExpiryTrackerModal } from "./expiry-tracker-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { receiveProductDeliveryAction, toggleProductArchiveAction } from "@/app/actions/products";

export function ProductsTable({
  enrichedProducts,
  categoriesData,
  suppliersData,
  ingredientsData,
  expiryBatchesData,
  isIngredientsBased
}: any) {
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<"edit" | "delivery" | "expiry" | "archive" | null>(null);

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (₱)</TableHead>
              <TableHead>Cost (₱)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {enrichedProducts.map((p: any) => {
              const isLowStock = !p.hasIngredients && p.stock > 0 && p.stock < 10;
              const isOutOfStock = !p.hasIngredients && p.stock <= 0;
              
              return (
                <TableRow 
                  key={p.id} 
                  className={p.isArchived ? "bg-gray-50/50 [&>td:not(:last-child)]:opacity-50" : ""}
                >
                  <TableCell className="font-medium flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded shrink-0 border border-black/10 relative overflow-hidden flex items-center justify-center" 
                      style={{ backgroundColor: p.backgroundColor || "#cbd5e1" }}
                    >
                      {p.hasImage && (
                        <Image
                          src={`/api/products/${p.id}/image`}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span>{p.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        {p.hasIngredients && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-sm">Recipe</span>
                        )}
                        {p.hasModifiers && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-sm">Modifiers</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.categoryName || "—"}</TableCell>
                  <TableCell>{formatPeso(Number(p.price))}</TableCell>
                  <TableCell>{formatPeso(Number(p.costPrice))}</TableCell>
                  <TableCell>
                    {p.hasIngredients ? (
                      <span className="text-gray-400 text-xs italic">Uses recipe</span>
                    ) : (
                      <span className={cn(
                        "font-medium",
                        isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : ""
                      )}>
                        {p.stock}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{p.supplierName || "—"}</TableCell>
                  <TableCell>
                    {p.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActionsMenu 
                      product={p}
                      onAction={(action: any) => {
                        setActiveProduct(p);
                        setActiveModal(action);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* MODALS RENDERED ONCE OUTSIDE THE DATAGRID */}
      {activeProduct && (
        <>
          <EditProductModal 
            product={activeProduct} 
            open={activeModal === "edit"} 
            onOpenChange={(open) => !open && setActiveModal(null)} 
            categories={categoriesData} 
            suppliers={suppliersData}
            ingredients={ingredientsData} 
            isIngredientsBased={isIngredientsBased}
          />

          <Dialog open={activeModal === "delivery"} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Receive Delivery</DialogTitle>
                <DialogDescription>
                  Record new stock for <b>{activeProduct.name}</b>.
                </DialogDescription>
              </DialogHeader>
              <form action={async (formData) => {
                await receiveProductDeliveryAction(null, formData);
                setActiveModal(null);
              }}>
                <input type="hidden" name="productId" value={activeProduct.id} />
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Current Stock</label>
                    <div className="col-span-3 text-lg font-bold">{activeProduct.stock}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Quantity Received</label>
                    <Input name="quantity" type="number" min="1" step="1" className="col-span-3" required autoFocus />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                  <Button type="submit" className="bg-[#FD6708] hover:bg-[#e55d07] text-white">Confirm Delivery</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ExpiryTrackerModal 
            product={activeProduct} 
            open={activeModal === "expiry"} 
            onOpenChange={(open) => !open && setActiveModal(null)} 
            batches={expiryBatchesData.filter((b: any) => b.productId === activeProduct.id)}
          />

          <Dialog open={activeModal === "archive"} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{activeProduct.isArchived ? "Restore Product" : "Archive Product"}</DialogTitle>
                <DialogDescription>
                  {activeProduct.isArchived 
                    ? `Are you sure you want to restore ${activeProduct.name}? It will appear in the POS again.`
                    : `Are you sure you want to archive ${activeProduct.name}? It will be hidden from the POS.`
                  }
                </DialogDescription>
              </DialogHeader>
              <form action={async () => {
                await toggleProductArchiveAction(activeProduct.id, !activeProduct.isArchived);
                setActiveModal(null);
              }}>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                  <Button type="submit" variant={activeProduct.isArchived ? "default" : "destructive"}>
                    {activeProduct.isArchived ? "Restore Product" : "Archive Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
