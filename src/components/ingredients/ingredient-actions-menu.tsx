"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { MoreHorizontal, Edit, PackagePlus, ArrowRightLeft, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFormStatus } from "react-dom";
import { editIngredientAction, adjustStockAction, receiveDeliveryAction, toggleArchiveIngredientAction } from "@/app/actions/ingredients";
import { formatPeso } from "@/lib/utils";

function SubmitButton({ label, pendingLabel }: { label: string, pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function IngredientActionsMenu({ ingredient }: { ingredient: any }) {
  const [activeModal, setActiveModal] = useState<"edit" | "adjust" | "receive" | "archive" | null>(null);

  // States for custom logic
  const [uom, setUom] = useState(ingredient.unitOfMeasurement);
  const isCustomUom = !["kg", "g", "L", "mL", "pcs", "box", "pack"].includes(ingredient.unitOfMeasurement);
  if (isCustomUom && uom !== "other" && uom !== ingredient.unitOfMeasurement) {
    setUom("other");
  }

  const [newStock, setNewStock] = useState<string>("");
  const stockDiff = Number(newStock) - Number(ingredient.stock);

  // Action States
  const [editState, editAction] = useActionState(editIngredientAction, null);
  const [adjustState, adjustAction] = useActionState(adjustStockAction, null);
  const [receiveState, receiveAction] = useActionState(receiveDeliveryAction, null);
  
  const [isPending, startTransition] = useTransition();

  // Close modals on success
  useEffect(() => {
    if (editState?.success) setActiveModal(null);
    if (adjustState?.success) setActiveModal(null);
    if (receiveState?.success) setActiveModal(null);
  }, [editState, adjustState, receiveState]);

  const handleArchiveToggle = () => {
    startTransition(() => {
      toggleArchiveIngredientAction(ingredient.id, ingredient.isArchived);
      setActiveModal(null);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveModal("edit")}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("adjust")}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("receive")}>
            <PackagePlus className="mr-2 h-4 w-4" /> Receive Delivery
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("archive")} className={ingredient.isArchived ? "text-emerald-600" : "text-amber-600"}>
            {ingredient.isArchived ? (
              <><ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive</>
            ) : (
              <><Archive className="mr-2 h-4 w-4" /> Archive</>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 1. Edit Modal */}
      <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          <form action={editAction} className="space-y-4 py-2">
            <input type="hidden" name="id" value={ingredient.id} />
            {editState?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{editState.error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" defaultValue={ingredient.name} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select name="uom" value={isCustomUom ? "other" : uom} onChange={(e) => setUom(e.target.value)}>
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
              {isCustomUom && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Unit</label>
                  <Input name="customUom" defaultValue={ingredient.unitOfMeasurement} required />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost / Unit (₱)</label>
                <Input name="cost" type="number" step="0.01" defaultValue={Number(ingredient.costPerUnit)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Stock</label>
                <Input type="number" defaultValue={Number(ingredient.stock)} disabled className="bg-gray-50" />
                <p className="text-[10px] text-gray-500 leading-tight">Use Adjust/Receive to update stock.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Low Stock Alert Level</label>
              <Input name="reorderLevel" type="number" step="0.001" defaultValue={Number(ingredient.reorderLevel)} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
              <SubmitButton label="Save Changes" pendingLabel="Saving..." />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Adjust Stock Modal */}
      <Dialog open={activeModal === "adjust"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Manually update inventory for {ingredient.name}.</DialogDescription>
          </DialogHeader>
          <form action={adjustAction} className="space-y-4 py-2">
            <input type="hidden" name="id" value={ingredient.id} />
            {adjustState?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{adjustState.error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Stock</label>
                <div className="h-10 px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 font-mono text-sm">
                  {Number(ingredient.stock)} {ingredient.unitOfMeasurement}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Actual New Stock</label>
                <Input name="newStock" type="number" step="0.001" required value={newStock} onChange={(e) => setNewStock(e.target.value)} />
                {newStock && !isNaN(stockDiff) && (
                  <p className={`text-xs font-medium ${stockDiff < 0 ? "text-red-500" : stockDiff > 0 ? "text-emerald-500" : "text-gray-500"}`}>
                    Diff: {stockDiff > 0 ? "+" : ""}{stockDiff} {ingredient.unitOfMeasurement}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Notes</label>
              <Input name="notes" placeholder="e.g., Found extra in back, Spilled" required />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
              <SubmitButton label="Confirm Adjustment" pendingLabel="Updating..." />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Receive Delivery Modal */}
      <Dialog open={activeModal === "receive"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Receive Delivery</DialogTitle>
            <DialogDescription>Log a new delivery of {ingredient.name}.</DialogDescription>
          </DialogHeader>
          <form action={receiveAction} className="space-y-4 py-2">
            <input type="hidden" name="id" value={ingredient.id} />
            {receiveState?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{receiveState.error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity to Add</label>
                <Input name="quantity" type="number" step="0.001" min="0.001" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Cost / Unit (₱)</label>
                <Input name="cost" type="number" step="0.01" defaultValue={Number(ingredient.costPerUnit)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier / Reference #</label>
              <Input name="referenceNumber" placeholder="e.g., INV-2023, SM Supermarket" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Received By</label>
              <Input name="receivedBy" placeholder="e.g., John Doe" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
              <SubmitButton label="Log Delivery" pendingLabel="Saving..." />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Archive Confirmation */}
      <Dialog open={activeModal === "archive"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{ingredient.isArchived ? "Unarchive" : "Archive"} {ingredient.name}?</DialogTitle>
            <DialogDescription>
              {ingredient.isArchived 
                ? "This ingredient will become active and visible again in your product recipes."
                : "This ingredient will be hidden from reports and recipes. Its historical data will be preserved."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant={ingredient.isArchived ? "success" : "destructive"} onClick={handleArchiveToggle} disabled={isPending}>
              {isPending ? "Updating..." : ingredient.isArchived ? "Yes, Unarchive" : "Yes, Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
