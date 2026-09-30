"use client";

import { useState, useTransition, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitReconciliationAction } from "@/app/actions/reconciliations";
import { formatPeso } from "@/lib/utils";
import { Calculator, Save, AlertCircle } from "lucide-react";

export function ReconciliationModal({ 
  open, 
  onOpenChange,
  ingredients
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  ingredients: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [updateStock, setUpdateStock] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeIngredients = useMemo(() => ingredients.filter(i => !i.isArchived), [ingredients]);

  const handleFillSystem = () => {
    const newCounts: Record<number, string> = {};
    activeIngredients.forEach(i => {
      newCounts[i.id] = Number(i.stock).toString();
    });
    setCounts(newCounts);
  };

  // Calculate live variance
  const { totalLoss, totalGain } = useMemo(() => {
    let loss = 0;
    let gain = 0;
    activeIngredients.forEach(ing => {
      const actualStr = counts[ing.id];
      const actual = actualStr !== undefined && actualStr !== "" ? Number(actualStr) : Number(ing.stock);
      const system = Number(ing.stock);
      const diff = actual - system; // positive = gain, negative = loss
      const cost = diff * Number(ing.costPerUnit);
      
      if (cost < 0) loss += Math.abs(cost);
      if (cost > 0) gain += cost;
    });
    return { totalLoss: loss, totalGain: gain };
  }, [counts, activeIngredients]);

  const handleSubmit = async () => {
    startTransition(async () => {
      setError(null);
      const items = activeIngredients.map(ing => {
        const actualStr = counts[ing.id];
        return {
          ingredientId: ing.id,
          actualStock: actualStr !== undefined && actualStr !== "" ? Number(actualStr) : Number(ing.stock)
        };
      });

      const result = await submitReconciliationAction({
        notes,
        updateStock,
        items
      });

      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        setCounts({});
        setNotes("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50 gap-0">
        
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 border-b shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#FD6708]" />
                End of Day Count
              </DialogTitle>
              <DialogDescription className="mt-1 break-words text-sm sm:text-base">
                Enter actual physical counts for your ingredients. Empty fields will default to the current system stock.
              </DialogDescription>
            </div>
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm font-medium bg-gray-100 py-2 px-3 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={updateStock} 
                  onChange={(e) => setUpdateStock(e.target.checked)}
                  className="w-4 h-4 accent-[#FD6708]"
                />
                Update Stock
              </label>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs sm:text-sm" onClick={handleFillSystem}>Auto-fill</Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Ingredient Name</th>
                  <th className="px-4 py-3 text-right">System Stock</th>
                  <th className="px-4 py-3 w-48">Actual Count</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeIngredients.map(ing => {
                  const system = Number(ing.stock);
                  const actualStr = counts[ing.id];
                  const actual = actualStr !== undefined && actualStr !== "" ? Number(actualStr) : system;
                  const diff = actual - system;
                  
                  return (
                    <tr key={ing.id} className={diff !== 0 ? "bg-amber-50/30" : ""}>
                      <td className="px-4 py-3 font-medium">{ing.name}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {system} {ing.unitOfMeasurement}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Input 
                            type="number" 
                            step="0.001"
                            placeholder={system.toString()}
                            value={counts[ing.id] ?? ""}
                            onChange={(e) => setCounts({ ...counts, [ing.id]: e.target.value })}
                            className={`w-full pr-12 text-right ${diff < 0 ? "border-red-300 focus:ring-red-500" : diff > 0 ? "border-emerald-300 focus:ring-emerald-500" : ""}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                            {ing.unitOfMeasurement}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {diff === 0 ? (
                          <span className="text-gray-300">-</span>
                        ) : diff < 0 ? (
                          <span className="text-red-600">{diff}</span>
                        ) : (
                          <span className="text-emerald-600">+{diff}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Audit Notes (Optional)</label>
            <Input 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="E.g., End of day count for closing shift" 
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-white p-4 sm:p-6 border-t shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="flex justify-between sm:justify-start sm:gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Loss</div>
              <div className="text-lg font-bold text-red-600">{formatPeso(totalLoss)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unexpected Gain</div>
              <div className="text-lg font-bold text-emerald-600">{formatPeso(totalGain)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-[2] sm:flex-none px-4 sm:px-8">
              {isPending ? "Saving..." : "Save Count"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
