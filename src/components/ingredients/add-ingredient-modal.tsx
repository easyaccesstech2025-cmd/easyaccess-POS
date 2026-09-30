"use client";

import { useState, useActionState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createIngredientAction } from "@/app/actions/ingredients";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving..." : "Save Ingredient"}
    </Button>
  );
}

export function AddIngredientModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(createIngredientAction, null);
  const [uom, setUom] = useState("kg");

  // Close modal on success
  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      // Optional: reset form state here if needed
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Ingredient</DialogTitle>
          <DialogDescription>
            Enter the details for your new inventory item.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4 py-2">
          {state?.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {state.error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
            <Input id="name" name="name" placeholder="e.g., White Sugar" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label htmlFor="uom" className="text-sm font-medium">Unit <span className="text-red-500">*</span></label>
              <Select id="uom" name="uom" value={uom} onChange={(e) => setUom(e.target.value)}>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="mL">Milliliters (mL)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="other">Other (Custom)</option>
              </Select>
            </div>
            
            {uom === "other" && (
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label htmlFor="customUom" className="text-sm font-medium">Custom Unit <span className="text-red-500">*</span></label>
                <Input id="customUom" name="customUom" placeholder="e.g., slice" required={uom === "other"} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="cost" className="text-sm font-medium">Cost / Unit (₱)</label>
              <Input id="cost" name="cost" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="stock" className="text-sm font-medium">Initial Stock</label>
              <Input id="stock" name="stock" type="number" step="0.001" defaultValue="0" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reorderLevel" className="text-sm font-medium">Low Stock Alert Level</label>
            <Input id="reorderLevel" name="reorderLevel" type="number" step="0.001" min="0" defaultValue="0" />
            <p className="text-xs text-gray-500 leading-tight">You will be warned when stock drops to this amount or lower.</p>
          </div>

          <DialogFooter className="pt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
