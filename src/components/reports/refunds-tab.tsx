"use client";

import { useState } from "react";
import { formatPeso, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function RefundsTab({ refundsData, refundItemsData, usersData }: any) {
  const [search, setSearch] = useState("");

  const userMap: Record<number, string> = {};
  usersData.forEach((u: any) => userMap[u.id] = u.name || "Unknown User");

  let filteredRefunds = refundsData.filter((r: any) => {
    if (search) {
      const ref = `REF-${r.id}`;
      const txn = `TXN-${r.orderId}`;
      const cashierName = userMap[r.cashierId]?.toLowerCase() || "";
      const reason = r.refundReason?.toLowerCase() || "";
      
      if (!ref.toLowerCase().includes(search.toLowerCase()) && 
          !txn.toLowerCase().includes(search.toLowerCase()) && 
          !cashierName.includes(search.toLowerCase()) &&
          !reason.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate KPIs
  const totalRefundsCount = filteredRefunds.length;
  const totalRefundedAmount = filteredRefunds.reduce((sum: number, r: any) => sum + Number(r.totalRefunded), 0);
  
  // Calculate loss amount (refund items where returnedToInventory is false)
  const lossAmount = filteredRefunds.reduce((sum: number, r: any) => {
    const items = refundItemsData.filter((ri: any) => ri.refundId === r.id);
    const lossItems = items.filter((ri: any) => !ri.returnedToInventory);
    return sum + lossItems.reduce((s: number, ri: any) => s + Number(ri.amountRefunded || 0), 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Refunds</div>
            <div className="text-3xl font-bold">{totalRefundsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Amount Refunded</div>
            <div className="text-3xl font-bold text-red-600">{formatPeso(totalRefundedAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Loss (Inventory)</div>
            <div className="text-3xl font-bold text-orange-600">{formatPeso(lossAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col overflow-hidden border shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by ID, cashier, or reason..." 
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
                <th className="px-6 py-3 font-medium">Refund ID</th>
                <th className="px-6 py-3 font-medium">Sale ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Cashier</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Approved By</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No refunds found.
                  </td>
                </tr>
              ) : filteredRefunds.map((refund: any) => {
                const items = refundItemsData.filter((ri: any) => ri.refundId === refund.id);
                const totalQty = items.reduce((sum: number, ri: any) => sum + Number(ri.quantityRefunded), 0);
                
                // If any item was NOT returned to inventory, we consider the refund a loss.
                // Or if it was all returned to inventory, it's Returned.
                const isLoss = items.some((ri: any) => !ri.returnedToInventory);

                return (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors whitespace-nowrap">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      REF-{refund.id}
                    </td>
                    <td className="px-6 py-3 text-blue-600 hover:underline cursor-pointer">
                      TXN-{refund.orderId}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(Number(refund.createdAtMs)).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {userMap[refund.cashierId]}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {totalQty} items
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate" title={refund.refundReason}>
                      {refund.refundReason}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {refund.approvedByManagerId ? userMap[refund.approvedByManagerId] : "-"}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatPeso(Number(refund.totalRefunded))}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {isLoss ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Loss</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Returned</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
