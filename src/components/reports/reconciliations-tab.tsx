"use client";

import { useState, useTransition, useMemo } from "react";
import { cn, formatPeso } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, Plus, Download, AlertCircle, Save, X, ClipboardCheck } from "lucide-react";
import { submitReconciliationAction } from "@/app/actions/reconciliations";

export function ReconciliationsTab({ reconciliations, reconItems, ingredients, usersData, isIngredientsBased }: any) {
  const [activeRecon, setActiveRecon] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  
  // Creation State
  const [isPending, startTransition] = useTransition();
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [updateStock, setUpdateStock] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!isIngredientsBased) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-24 text-center text-gray-500 flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <ClipboardCheck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients Tracking Required</h3>
          <p className="max-w-md">Your account is currently set to POS-Only. To track raw ingredients and perform physical stock reconciliations, you need to upgrade to an Ingredients Base account.</p>
        </CardContent>
      </Card>
    );
  }

  const userMap: Record<number, string> = {};
  usersData.forEach((u: any) => userMap[u.id] = u.name || "Unknown User");

  const ingredientMap: Record<number, any> = {};
  ingredients.forEach((i: any) => ingredientMap[i.id] = i);

  // Apply filters
  const filteredHistory = reconciliations.filter((r: any) => {
    if (search) {
      const q = search.toLowerCase();
      const n = (r.notes || "").toLowerCase();
      const user = (userMap[r.performedBy] || "").toLowerCase();
      if (!n.includes(q) && !user.includes(q)) return false;
    }
    return true;
  });

  const handleStartCount = () => {
    const newCounts: Record<number, string> = {};
    ingredients.forEach((i: any) => {
      if (!i.isArchived) {
        newCounts[i.id] = Number(i.stock).toString();
      }
    });
    setCounts(newCounts);
    setNotes("");
    setError("");
    setIsCreating(true);
    setActiveRecon(null);
  };

  const handleCountChange = (id: number, val: string) => {
    setCounts(prev => ({ ...prev, [id]: val }));
  };

  const { newLoss, newGain } = useMemo(() => {
    let loss = 0;
    let gain = 0;
    ingredients.filter((i:any) => !i.isArchived).forEach((ing: any) => {
      const actualStr = counts[ing.id];
      const actual = actualStr !== undefined && actualStr !== "" ? Number(actualStr) : Number(ing.stock);
      const system = Number(ing.stock);
      const diff = actual - system;
      const cost = diff * Number(ing.costPerUnit || 0);
      
      if (cost < 0) loss += Math.abs(cost);
      if (cost > 0) gain += cost;
    });
    return { newLoss: loss, newGain: gain };
  }, [counts, ingredients]);

  const handleSubmit = () => {
    startTransition(async () => {
      setError("");
      const itemsToSubmit = ingredients
        .filter((i:any) => !i.isArchived)
        .map((ing: any) => {
          const actualStr = counts[ing.id];
          return {
            ingredientId: ing.id,
            actualStock: actualStr !== undefined && actualStr !== "" ? Number(actualStr) : Number(ing.stock)
          };
        });

      const result = await submitReconciliationAction({
        notes,
        updateStock,
        items: itemsToSubmit
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setIsCreating(false);
      }
    });
  };

  const exportToCsv = (recon: any) => {
    const items = reconItems.filter((ri: any) => ri.reconciliationId === recon.id);
    const headers = ["Ingredient", "System Stock", "Actual Stock", "Variance", "Financial Impact", "Notes"];
    
    const rows = items.map((ri: any) => {
      const ing = ingredientMap[ri.ingredientId];
      return [
        `"${ing?.name || 'Unknown'}"`,
        ri.systemStock,
        ri.actualStock,
        ri.variance,
        ri.varianceCost,
        `"${ri.notes || ''}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reconciliation_${recon.id}_${new Date(Number(recon.createdAtMs)).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCreating) {
    return (
      <Card className="flex flex-col h-[calc(100vh-14rem)] overflow-hidden border shadow-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Physical Count
            </h3>
            <p className="text-xs text-gray-500">Press TAB to move between rows rapidly.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsCreating(false)} disabled={isPending}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-2" /> {isPending ? "Saving..." : "Save Count"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white min-h-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white border-b shadow-sm uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium w-1/3">Ingredient Name</th>
                <th className="px-6 py-3 font-medium w-1/6">System Stock</th>
                <th className="px-6 py-3 font-medium w-1/6 bg-blue-50/50">Actual Count (Edit)</th>
                <th className="px-6 py-3 font-medium w-1/6">Variance Qty</th>
                <th className="px-6 py-3 font-medium text-right w-1/6">Financial Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredients.filter((i:any) => !i.isArchived).map((ing: any) => {
                const actualStr = counts[ing.id];
                const actual = actualStr !== undefined && actualStr !== "" ? Number(actualStr) : Number(ing.stock);
                const system = Number(ing.stock);
                const diff = actual - system;
                const cost = diff * Number(ing.costPerUnit || 0);

                return (
                  <tr key={ing.id} className={cn("hover:bg-gray-50 transition-colors", diff !== 0 && "bg-orange-50/30")}>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {ing.name} <span className="text-xs text-gray-400 font-normal ml-1">({ing.unitOfMeasurement})</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono">
                      {system}
                    </td>
                    <td className="px-6 py-3 bg-blue-50/30">
                      <Input 
                        type="number" 
                        step="any"
                        value={actualStr === undefined ? system : actualStr}
                        onChange={(e) => handleCountChange(ing.id, e.target.value)}
                        className="h-8 font-mono border-blue-200 focus-visible:ring-blue-500 w-full max-w-[120px]"
                        disabled={isPending}
                      />
                    </td>
                    <td className="px-6 py-3">
                      {diff === 0 ? (
                        <span className="text-gray-400">Match</span>
                      ) : (
                        <span className={diff > 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {cost === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <span className={cost > 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                          {cost > 0 ? "+" : ""}{formatPeso(cost)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-6 items-center shrink-0">
          <div className="flex-1 space-y-3">
            <Input 
              placeholder="Add notes for this reconciliation (optional)..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
              <input 
                type="checkbox" 
                checked={updateStock} 
                onChange={(e) => setUpdateStock(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
                disabled={isPending}
              />
              Update live system stock to match these physical counts
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="flex gap-6 pr-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Loss Found</div>
              <div className="text-xl font-bold text-red-600">-{formatPeso(newLoss)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Gain Found</div>
              <div className="text-xl font-bold text-emerald-600">+{formatPeso(newGain)}</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)]">
      {/* LEFT: MASTER LIST */}
      <Card className={cn("flex-1 flex-col overflow-hidden border shadow-sm", activeRecon ? "hidden lg:flex" : "flex")}>
        <div className="p-4 border-b bg-gray-50/50 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Reconciliation History</h3>
            <Button size="sm" onClick={handleStartCount} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Count
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search notes or staff..." 
                className="pl-9 bg-white h-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1 bg-gray-50/30 p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg border border-dashed">
              No reconciliations found.
            </div>
          ) : filteredHistory.map((recon: any) => {
            const isActive = activeRecon?.id === recon.id;
            const loss = Number(recon.totalLossCost || 0);
            const gain = Number(recon.totalGainCost || 0);
            const net = gain - loss;

            return (
              <div 
                key={recon.id} 
                onClick={() => setActiveRecon(recon)}
                className={cn(
                  "bg-white p-4 rounded-xl border shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group",
                  isActive ? "ring-2 ring-blue-500 border-transparent" : ""
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-blue-600">Audit #{recon.id}</div>
                    <div className="text-xs text-gray-500 font-medium">{userMap[recon.performedBy]}</div>
                  </div>
                  {recon.isStockUpdated ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Stock Applied</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">Count Only</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(Number(recon.createdAtMs)).toLocaleString()}</span>
                  </div>
                  {recon.notes && (
                    <div className="text-xs text-gray-500 italic truncate max-w-[200px]">"{recon.notes}"</div>
                  )}
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-medium">Net Impact:</div>
                  <div className={cn("text-lg font-bold", net < 0 ? "text-red-600" : net > 0 ? "text-emerald-600" : "text-gray-900")}>
                    {net === 0 ? "EXACT MATCH" : net < 0 ? `-${formatPeso(Math.abs(net))}` : `+${formatPeso(net)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RIGHT: DETAIL VIEW */}
      <Card className={cn("w-full lg:w-[600px] shrink-0 flex-col border bg-white shadow-md relative overflow-hidden", !activeRecon ? "hidden lg:flex" : "flex")}>
        {!activeRecon ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-gray-300" />
            </div>
            <p>Select an audit from the list to view its full physical count details</p>
          </div>
        ) : (
          (() => {
            const items = reconItems.filter((ri: any) => ri.reconciliationId === activeRecon.id);
            const loss = Number(activeRecon.totalLossCost || 0);
            const gain = Number(activeRecon.totalGainCost || 0);

            return (
              <>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center shadow-sm z-10 relative shrink-0">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={() => setActiveRecon(null)}>
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Audit #{activeRecon.id} Details
                    </h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportToCsv(activeRecon)}>
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>

                {/* Audit Print Area */}
                <div className="flex-1 overflow-auto p-0 min-h-0">
                  <div className="p-6 border-b border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Performed By</div>
                        <div className="font-medium text-gray-900">{userMap[activeRecon.performedBy]}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Date</div>
                        <div className="font-medium text-gray-900">{new Date(Number(activeRecon.createdAtMs)).toLocaleString()}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Notes</div>
                        <div className="font-medium text-gray-900 italic">{activeRecon.notes || "No notes provided."}</div>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50 border-b uppercase sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-medium">Ingredient</th>
                        <th className="px-4 py-3 font-medium text-center">System</th>
                        <th className="px-4 py-3 font-medium text-center">Actual</th>
                        <th className="px-6 py-3 font-medium text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item: any) => {
                        const ing = ingredientMap[item.ingredientId];
                        const diff = Number(item.variance);
                        const cost = Number(item.varianceCost);

                        return (
                          <tr key={item.id} className={cn("hover:bg-gray-50", diff !== 0 && "bg-orange-50/10")}>
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {ing?.name || `ID: ${item.ingredientId}`}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-500 font-mono">
                              {Number(item.systemStock)}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900 font-mono">
                              {Number(item.actualStock)}
                            </td>
                            <td className="px-6 py-3 text-right">
                              {cost === 0 ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                <span className={cost > 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                                  {cost > 0 ? "+" : ""}{formatPeso(cost)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold block mb-1">Total Loss: <span className="text-red-600 font-bold">-{formatPeso(loss)}</span></span>
                    <span className="font-semibold block">Total Gain: <span className="text-emerald-600 font-bold">+{formatPeso(gain)}</span></span>
                  </div>
                  {activeRecon.isStockUpdated && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Stock Automatically Updated</Badge>
                  )}
                </div>
              </>
            );
          })()
        )}
      </Card>
    </div>
  );
}
