"use client";

import { useState } from "react";
import { Plus, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/products/search-bar";
import { AddIngredientModal } from "./add-ingredient-modal";
import { ReconciliationModal } from "./reconciliation-modal";

export function IngredientsHeader({ ingredients }: { ingredients: any[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchBar placeholder="Search ingredients..." />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none bg-white" onClick={() => setIsReconModalOpen(true)}>
            <ClipboardCheck className="mr-2 h-4 w-4 text-[#FD6708]" /> EOD Count
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Ingredient
          </Button>
        </div>
      </div>

      <AddIngredientModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <ReconciliationModal open={isReconModalOpen} onOpenChange={setIsReconModalOpen} ingredients={ingredients} />
    </>
  );
}
