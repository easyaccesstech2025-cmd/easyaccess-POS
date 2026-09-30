"use client";

import { useState } from "react";
import { formatPeso, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, CheckCircle2, RotateCcw, Printer, ArrowDownToLine, ChevronRight } from "lucide-react";

export function SalesHistoryTab({ ordersData, itemsData, modifiersData, usersData, refundsData }: any) {
  const [search, setSearch] = useState("");
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Map users
  const userMap: Record<number, string> = {};
  usersData.forEach((u: any) => userMap[u.id] = u.name || "Unknown User");

  // Map refunds
  const refundedOrderIds = new Set(refundsData.map((r: any) => r.orderId));

  // Sort and filter orders
  let filteredOrders = ordersData.filter((o: any) => {
    if (showDiscountedOnly && !itemsData.some((i: any) => i.orderId === o.id && i.discountValue > 0)) {
      return false;
    }
    if (search) {
      const ref = o.referenceNumber?.toLowerCase() || "";
      const cashierName = userMap[o.cashierId]?.toLowerCase() || "";
      if (!ref.includes(search.toLowerCase()) && !cashierName.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)]">
      {/* LEFT: MASTER LIST */}
      <Card className={cn("flex-1 flex-col overflow-hidden border shadow-sm", activeOrder ? "hidden lg:flex" : "flex")}>
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search ref # or cashier..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-[#FD6708] focus:ring-[#FD6708]"
                checked={showDiscountedOnly}
                onChange={(e) => setShowDiscountedOnly(e.target.checked)}
              />
              Show discounted only
            </label>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white sticky top-0 border-b shadow-sm z-10 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Ref #</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Cashier</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : filteredOrders.map((order: any) => {
                const isRefunded = refundedOrderIds.has(order.id);
                const orderItemsList = itemsData.filter((i: any) => i.orderId === order.id);
                const hasDiscount = orderItemsList.some((i: any) => i.discountValue > 0);
                const totalDiscount = orderItemsList.reduce((sum: number, i: any) => sum + Number(i.discountValue || 0), 0);
                const isActive = activeOrder?.id === order.id;

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => setActiveOrder(order)}
                    className={cn(
                      "hover:bg-orange-50/50 cursor-pointer transition-colors group",
                      isActive ? "bg-orange-50 border-l-4 border-l-[#FD6708]" : "border-l-4 border-l-transparent"
                    )}
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 group-hover:text-[#FD6708]">
                      {order.referenceNumber || `#${order.id}`}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(Number(order.createdAtMs)).toLocaleDateString()} <span className="text-gray-400 text-xs ml-1">{new Date(Number(order.createdAtMs)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {userMap[order.cashierId]}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="font-semibold text-gray-900">{formatPeso(Number(order.totalAmount))}</div>
                      {hasDiscount && <div className="text-xs text-red-500">-{formatPeso(totalDiscount)}</div>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {isRefunded ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Refunded</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Completed</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RIGHT: RECEIPT PREVIEW (DETAIL) */}
      <Card className={cn("w-full lg:w-[400px] shrink-0 flex-col border bg-[#fdfdfd] shadow-md relative overflow-hidden", !activeOrder ? "hidden lg:flex" : "flex")}>
        {!activeOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <p>Select a transaction from the list to view its receipt</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 relative">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={() => setActiveOrder(null)}>
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
                <h3 className="font-semibold flex items-center gap-2">
                  Receipt Preview
                </h3>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print Receipt">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Receipt Paper Effect */}
            <div className="flex-1 overflow-auto p-6 bg-[#f4f4f5] receipt-print-area">
              <div className="bg-white p-6 shadow-sm max-w-sm mx-auto font-mono text-sm border-t-8 border-t-gray-800">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="font-bold text-xl uppercase tracking-widest mb-1">Easy POS</h2>
                  <div className="text-gray-500 text-xs flex justify-center items-center gap-1">
                    <MapPin className="h-3 w-3" /> Store Address
                  </div>
                </div>

                <div className="border-b border-dashed border-gray-300 pb-4 mb-4 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(Number(activeOrder.createdAtMs)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{userMap[activeOrder.cashierId]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Txn ID:</span>
                    <span className="font-medium text-gray-900">{activeOrder.referenceNumber || activeOrder.id}</span>
                  </div>
                  {refundedOrderIds.has(activeOrder.id) && (
                    <div className="flex justify-between text-red-600 font-bold mt-2 pt-2 border-t border-dashed">
                      <span>STATUS:</span>
                      <span>REFUNDED</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-4 border-b border-dashed border-gray-300 pb-4 mb-4">
                  {itemsData.filter((i: any) => i.orderId === activeOrder.id).map((item: any) => {
                    const mods = modifiersData.filter((m: any) => m.orderItemId === item.id);
                    return (
                      <div key={item.id} className="text-gray-800 text-xs">
                        <div className="font-semibold uppercase mb-1">{item.productName}</div>
                        {mods.length > 0 && (
                          <div className="pl-2 mb-1 text-gray-500">
                            {mods.map((m: any) => (
                              <div key={m.id}>+ {m.optionName}</div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">
                            {item.quantity} x {formatPeso(Number(item.unitPrice))}
                          </span>
                          <span className="font-semibold">
                            {formatPeso(item.quantity * Number(item.unitPrice))}
                          </span>
                        </div>
                        {Number(item.discountValue) > 0 && (
                          <div className="flex justify-between items-center text-red-500 mt-0.5">
                            <span>Discount ({item.discountNote || "Applied"})</span>
                            <span>-{formatPeso(Number(item.discountValue))}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>
                      {formatPeso(
                        itemsData.filter((i: any) => i.orderId === activeOrder.id)
                        .reduce((sum: number, i: any) => sum + (i.quantity * Number(i.unitPrice)), 0)
                      )}
                    </span>
                  </div>
                  
                  {(() => {
                    const totalDiscount = itemsData.filter((i: any) => i.orderId === activeOrder.id)
                        .reduce((sum: number, i: any) => sum + Number(i.discountValue || 0), 0);
                    if (totalDiscount > 0) {
                      return (
                        <div className="flex justify-between text-red-500">
                          <span>Discounts</span>
                          <span>-{formatPeso(totalDiscount)}</span>
                        </div>
                      )
                    }
                    return null;
                  })()}

                  <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-dashed">
                    <span>TOTAL</span>
                    <span>{formatPeso(Number(activeOrder.totalAmount))}</span>
                  </div>
                </div>

                {/* Payment Footer */}
                <div className="mt-6 bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-gray-900">{activeOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cash Tendered:</span>
                    <span>{formatPeso(Number(activeOrder.amountReceived || activeOrder.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Change:</span>
                    <span>{formatPeso(Number(activeOrder.changeGiven || 0))}</span>
                  </div>
                </div>
                
                <div className="mt-8 text-center text-gray-400 text-[10px]">
                  Thank you for your business!
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
