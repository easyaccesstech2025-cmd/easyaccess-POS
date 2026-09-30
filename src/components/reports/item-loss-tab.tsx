"use client";
import React, { useState } from "react";
import { formatPeso, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronRight, PackageX, Beaker, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ItemLossTab({ 
  isIngredientsBased, 
  refundsData, 
  refundItemsData, 
  usersData, 
  productsList,
  ingredientsData,
  recipesData 
}: any) {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("products");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const userMap: Record<number, string> = {};
  usersData.forEach((u: any) => userMap[u.id] = u.name || "Unknown User");
  
  const productMap: Record<number, any> = {};
  productsList.forEach((p: any) => productMap[p.id] = p);
  
  const ingredientMap: Record<number, any> = {};
  if (isIngredientsBased) {
    ingredientsData.forEach((i: any) => ingredientMap[i.id] = i);
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Process Loss Records
  const productLosses: any[] = [];
  const ingredientLosses: any[] = [];
  
  refundItemsData.forEach((ri: any) => {
    if (ri.returnedToInventory) return; // Not a loss
    
    const refund = refundsData.find((r: any) => r.id === ri.refundId);
    if (!refund) return;
    
    const product = productMap[ri.productId];
    if (!product) return;

    const qty = Number(ri.quantityRefunded);
    const dateMs = Number(refund.createdAtMs);
    const reason = refund.refundReason;
    const cashier = userMap[refund.cashierId];
    const refundId = refund.id;

    // Track Product Loss (Amount lost = retail price lost)
    const productLossVal = qty * Number(product.price);
    productLosses.push({
      id: `p-${ri.id}`,
      productId: product.id,
      name: product.name,
      qty,
      amountLost: productLossVal,
      dateMs,
      reason,
      cashier,
      refundId
    });

    // Track Ingredient Loss
    if (isIngredientsBased) {
      const recipe = recipesData.filter((rec: any) => rec.productId === product.id);
      recipe.forEach((rec: any) => {
        const ing = ingredientMap[rec.ingredientId];
        if (!ing) return;
        
        const ingQtyLost = qty * Number(rec.quantityRequired);
        const ingCostLost = ingQtyLost * Number(ing.costPrice || 0);
        
        ingredientLosses.push({
          id: `i-${ri.id}-${ing.id}`,
          ingredientId: ing.id,
          name: ing.name,
          uom: ing.unitOfMeasurement,
          qty: ingQtyLost,
          amountLost: ingCostLost,
          dateMs,
          reason,
          cashier,
          refundId,
          sourceProduct: product.name
        });
      });
    }
  });

  // 2. Aggregate Losses
  const aggregateLosses = (losses: any[], keyField: string) => {
    const agg: Record<string, any> = {};
    
    losses.forEach(loss => {
      const key = loss[keyField];
      if (!agg[key]) {
        agg[key] = {
          keyId: key,
          name: loss.name,
          uom: loss.uom,
          totalQty: 0,
          totalAmount: 0,
          reasons: new Set<string>(),
          details: []
        };
      }
      agg[key].totalQty += loss.qty;
      agg[key].totalAmount += loss.amountLost;
      agg[key].reasons.add(loss.reason);
      agg[key].details.push(loss);
    });
    
    return Object.values(agg).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const aggProductLosses = aggregateLosses(productLosses, 'productId');
  const aggIngredientLosses = aggregateLosses(ingredientLosses, 'ingredientId');
  
  // Filter by search
  const filterAgg = (agg: any[]) => {
    if (!search) return agg;
    return agg.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  };
  
  const displayData = activeView === "products" ? filterAgg(aggProductLosses) : filterAgg(aggIngredientLosses);
  
  // KPIs
  const totalItemsLost = aggProductLosses.reduce((sum, item) => sum + item.totalQty, 0);
  const totalProductValueLost = aggProductLosses.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalIngredientValueLost = aggIngredientLosses.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-md w-full sm:w-[400px]">
          <button 
            onClick={() => setActiveView("products")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-sm transition-all", activeView === "products" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <PackageX className="h-4 w-4"/> Product Loss
          </button>
          <button 
            onClick={() => setActiveView("ingredients")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-sm transition-all", activeView === "ingredients" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Beaker className="h-4 w-4"/> Ingredient Loss
          </button>
        </div>
      </div>

      {!isIngredientsBased && activeView === "ingredients" ? (
        <Card className="border-dashed">
          <CardContent className="py-24 text-center text-gray-500 flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Beaker className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients Tracking Required</h3>
            <p className="max-w-md">Your account is currently set to POS-Only. To track raw ingredient losses automatically, you need to upgrade to an Ingredients Base account and set up product recipes.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Total {activeView === "products" ? "Products" : "Ingredients"} Lost</div>
                <div className="text-3xl font-bold">{activeView === "products" ? totalItemsLost : aggIngredientLosses.reduce((s, i) => s + i.totalQty, 0).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Estimated Value Lost</div>
                <div className="text-3xl font-bold text-red-600">{formatPeso(activeView === "products" ? totalProductValueLost : totalIngredientValueLost)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col overflow-hidden border shadow-sm">
            <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={`Search ${activeView}...`}
                  className="pl-9 bg-white" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-white border-b shadow-sm uppercase whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-6 py-3 font-medium">Item Name</th>
                    <th className="px-6 py-3 font-medium">Total Qty Lost</th>
                    <th className="px-6 py-3 font-medium text-right">Amount Lost</th>
                    <th className="px-6 py-3 font-medium">Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {displayData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No item losses found.
                      </td>
                    </tr>
                  ) : displayData.map((agg: any) => {
                    const isExpanded = expandedRows[agg.keyId];
                    return (
                      <React.Fragment key={agg.keyId}>
                        <tr 
                          onClick={() => toggleRow(agg.keyId)}
                          className={cn("hover:bg-gray-50 transition-colors cursor-pointer", isExpanded && "bg-gray-50")}
                        >
                          <td className="px-4 py-3 text-gray-400">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="px-6 py-3 font-bold text-gray-900">
                            {agg.name}
                          </td>
                          <td className="px-6 py-3 font-medium text-red-600">
                            {activeView === "products" ? agg.totalQty : `${Number(agg.totalQty).toFixed(2)} ${agg.uom}`}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-gray-900">
                            {formatPeso(agg.totalAmount)}
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            <div className="flex gap-1 flex-wrap">
                              {Array.from(agg.reasons).map((r: any) => (
                                <Badge key={r} variant="secondary" className="text-[10px] font-normal">{r}</Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                        
                        {/* EXPANDED DETAILS */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0 border-b-2 border-b-gray-200">
                              <div className="bg-gray-50/80 px-8 py-4 inset-shadow">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-1">Chronological Log</div>
                                <table className="w-full text-xs text-gray-600">
                                  <thead>
                                    <tr className="text-gray-400">
                                      <th className="py-1 text-left font-medium">Date</th>
                                      <th className="py-1 text-left font-medium">Refund ID</th>
                                      {activeView === "ingredients" && <th className="py-1 text-left font-medium">Source Product</th>}
                                      <th className="py-1 text-left font-medium">Cashier</th>
                                      <th className="py-1 text-right font-medium">Qty</th>
                                      <th className="py-1 text-right font-medium">Amount</th>
                                      <th className="py-1 text-left font-medium pl-4">Reason</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200/50">
                                    {agg.details.sort((a: any, b: any) => b.dateMs - a.dateMs).map((detail: any) => (
                                      <tr key={detail.id} className="hover:bg-gray-100/50">
                                        <td className="py-2">{new Date(detail.dateMs).toLocaleString()}</td>
                                        <td className="py-2 text-blue-600 font-mono">REF-{detail.refundId}</td>
                                        {activeView === "ingredients" && <td className="py-2 text-gray-500">{detail.sourceProduct}</td>}
                                        <td className="py-2">{detail.cashier}</td>
                                        <td className="py-2 text-right font-medium text-red-500">
                                          {activeView === "products" ? detail.qty : `${Number(detail.qty).toFixed(2)}`}
                                        </td>
                                        <td className="py-2 text-right">{formatPeso(detail.amountLost)}</td>
                                        <td className="py-2 pl-4 text-gray-500 italic">{detail.reason}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
