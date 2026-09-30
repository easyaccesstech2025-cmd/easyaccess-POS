"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowRight } from "lucide-react";

export function DeliveriesTab({ deliveriesData }: any) {
  const [search, setSearch] = useState("");

  let filteredDeliveries = deliveriesData.filter((d: any) => {
    if (search) {
      const productName = d.productName?.toLowerCase() || "";
      const supplierName = d.supplierName?.toLowerCase() || "";
      const ref = d.referenceNumber?.toLowerCase() || "";
      const receivedBy = d.receivedBy?.toLowerCase() || "";
      
      if (!productName.includes(search.toLowerCase()) && 
          !supplierName.includes(search.toLowerCase()) && 
          !ref.includes(search.toLowerCase()) &&
          !receivedBy.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate KPIs
  const totalDeliveries = filteredDeliveries.length;
  const totalItemsReceived = filteredDeliveries.reduce((sum: number, d: any) => sum + Number(d.quantity), 0);
  const uniqueProducts = new Set(filteredDeliveries.map((d: any) => d.productId)).size;

  const exportToCsv = () => {
    const headers = ["Date", "Product", "Supplier", "Ref #", "Received By", "Previous Stock", "Quantity Received", "New Stock", "Notes"];
    const rows = filteredDeliveries.map((d: any) => [
      new Date(Number(d.dateReceivedMs)).toLocaleString(),
      `"${d.productName || 'Unknown Product'}"`,
      `"${d.supplierName || '-'}"`,
      `"${d.referenceNumber || '-'}"`,
      `"${d.receivedBy || '-'}"`,
      d.previousStock,
      d.quantity,
      d.newStock,
      `"${d.notes || ''}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `delivery_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Delivery Logs</div>
            <div className="text-3xl font-bold">{totalDeliveries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Items Received</div>
            <div className="text-3xl font-bold text-blue-600">+{totalItemsReceived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Unique Products</div>
            <div className="text-3xl font-bold text-emerald-600">{uniqueProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col overflow-hidden border shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by product, supplier, ref #..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2" onClick={exportToCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white border-b shadow-sm uppercase whitespace-nowrap">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Product Name</th>
                <th className="px-6 py-3 font-medium">Supplier</th>
                <th className="px-6 py-3 font-medium">Ref #</th>
                <th className="px-6 py-3 font-medium text-center">Stock Transition</th>
                <th className="px-6 py-3 font-medium">Received By</th>
                <th className="px-6 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No deliveries found.
                  </td>
                </tr>
              ) : filteredDeliveries.map((delivery: any) => {
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition-colors whitespace-nowrap">
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(Number(delivery.dateReceivedMs)).toLocaleDateString()}{" "}
                      <span className="text-xs text-gray-400">{new Date(Number(delivery.dateReceivedMs)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {delivery.productName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {delivery.supplierName || "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                      {delivery.referenceNumber || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2 font-mono bg-blue-50/50 py-1 px-3 rounded-md border border-blue-100">
                        <span className="text-gray-500 w-8 text-right">{delivery.previousStock}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-blue-600 font-bold w-12 text-center">+{delivery.quantity}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-900 font-bold w-8 text-left">{delivery.newStock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {delivery.receivedBy || "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs max-w-[200px] truncate" title={delivery.notes}>
                      {delivery.notes || "-"}
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
