"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/products/search-bar";
import { AddProductModal } from "./add-product-modal";

export function ProductsHeader({ categories, suppliers, ingredients, isIngredientsBased }: { categories: any[], suppliers: any[], ingredients: any[], isIngredientsBased: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search by name or barcode..." />
        <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <AddProductModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        categories={categories}
        suppliers={suppliers}
        ingredients={ingredients}
        isIngredientsBased={isIngredientsBased}
      />
    </>
  );
}
