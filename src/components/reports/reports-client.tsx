"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPeso, cn } from "@/lib/utils";
import { Calendar, Download, Printer } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { SalesHistoryTab } from "./sales-history-tab";
import { RefundsTab } from "./refunds-tab";
import { ShiftHistoryTab } from "./shift-history-tab";
import { DeliveriesTab } from "./deliveries-tab";
import { ItemLossTab } from "./item-loss-tab";
import { GlobalReportTab } from "./global-report-tab";
import { ReconciliationsTab } from "./reconciliations-tab";

export function ReportsClient({ 
  isIngredientsBased,
  currentRange,
  startDateStr,
  endDateStr,
  kpis,
  itemsData,
  ordersData,
  modifiersData,
  usersData,
  refundsData,
  refundItemsData,
  sessionsData,
  cashTxData,
  deliveriesData,
  ingredientsData,
  recipesData,
  productsList,
  categoriesList,
  reconciliations,
  reconItems
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Business Insights");

  const tabs = [
    "Business Insights", "Sales History", "Refunds", "Shift History", "Deliveries", "Item Loss", "Global Report"
  ];
  if (isIngredientsBased) {
    tabs.splice(6, 0, "Reconciliations");
    // "Ingredients Report" could also be added if requested
  }

  const handleRangeChange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    params.delete("from");
    params.delete("to");
    router.push(`/reports?${params.toString()}`);
  };

  // --- Calculate Chart Data ---
  
  // 1. Sales by Category
  const categorySalesMap: Record<string, number> = {};
  itemsData.forEach((item: any) => {
    const cat = item.categoryName || "Uncategorized";
    const total = Number(item.unitPrice) * item.quantity;
    categorySalesMap[cat] = (categorySalesMap[cat] || 0) + total;
  });
  const categoryChartData = Object.keys(categorySalesMap).map(key => ({
    name: key,
    value: categorySalesMap[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // 2. Top Products
  const productSalesMap: Record<string, number> = {};
  itemsData.forEach((item: any) => {
    const prod = item.productName || "Unknown";
    productSalesMap[prod] = (productSalesMap[prod] || 0) + item.quantity;
  });
  const topProductsData = Object.keys(productSalesMap).map(key => ({
    name: key,
    sales: productSalesMap[key]
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  // 3. Sales Trend
  const salesByDate: Record<string, number> = {};
  ordersData.forEach((o: any) => {
    // get YYYY-MM-DD
    const dateStr = new Date(Number(o.createdAtMs)).toISOString().split('T')[0];
    salesByDate[dateStr] = (salesByDate[dateStr] || 0) + Number(o.totalAmount);
  });
  const trendData = Object.keys(salesByDate).sort().map(date => ({
    date,
    sales: salesByDate[date]
  }));

  const exportCSV = () => {
    alert("Exporting CSV... (This feature will trigger a download)");
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Global Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
          {[
            { id: "today", label: "Today" },
            { id: "this-week", label: "This Week" },
            { id: "this-month", label: "This Month" },
            { id: "this-year", label: "This Year" },
            { id: "all-time", label: "All Time" },
          ].map((f) => (
            <Button 
              key={f.id} 
              variant={currentRange === f.id ? "default" : "secondary"} 
              size="sm" 
              className={cn("rounded-full whitespace-nowrap", currentRange === f.id ? "bg-[#FD6708] hover:bg-[#e55d07]" : "")}
              onClick={() => handleRangeChange(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="bg-white">
            <Calendar className="mr-2 h-4 w-4" /> Custom
          </Button>
          <Button variant="outline" size="sm" className="bg-white" onClick={exportCSV}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map((tab) => (
          <Button 
            key={tab} 
            variant={activeTab === tab ? "default" : "ghost"} 
            className={cn("whitespace-nowrap rounded-full", activeTab === tab ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border shadow-sm")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* 3. Business Insights View */}
      {activeTab === "Business Insights" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Gross Sales</div>
                <div className="text-3xl font-bold">{formatPeso(kpis.grossSales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Net Sales</div>
                <div className="text-3xl font-bold text-emerald-700">{formatPeso(kpis.netSales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Net Profit</div>
                <div className="text-3xl font-bold text-blue-700">{formatPeso(kpis.netProfit)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium text-gray-500">Refunds</div>
                </div>
                <div className="text-3xl font-bold text-red-600">{formatPeso(kpis.totalRefunds)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `₱${val}`} />
                      <Tooltip formatter={(value: any) => formatPeso(Number(value))} />
                      <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">No data for this period</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatPeso(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">No data for this period</div>
                )}
                {categoryChartData.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {categoryChartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {entry.name}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top 5 Best-Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">No data for this period</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Sales History View */}
      {activeTab === "Sales History" && (
        <div className="animate-in fade-in duration-300">
          <SalesHistoryTab 
            ordersData={ordersData} 
            itemsData={itemsData} 
            modifiersData={modifiersData} 
            usersData={usersData} 
            refundsData={refundsData} 
          />
        </div>
      )}

      {/* 5. Refunds View */}
      {activeTab === "Refunds" && (
        <div className="animate-in fade-in duration-300">
          <RefundsTab 
            refundsData={refundsData}
            refundItemsData={refundItemsData}
            usersData={usersData}
          />
        </div>
      )}

      {/* 6. Shift History View */}
      {activeTab === "Shift History" && (
        <div className="animate-in fade-in duration-300">
          <ShiftHistoryTab 
            sessionsData={sessionsData}
            cashTxData={cashTxData}
            ordersData={ordersData}
            itemsData={itemsData}
            refundsData={refundsData}
            usersData={usersData}
          />
        </div>
      )}

      {/* 7. Deliveries View */}
      {activeTab === "Deliveries" && (
        <div className="animate-in fade-in duration-300">
          <DeliveriesTab deliveriesData={deliveriesData} />
        </div>
      )}

      {/* 8. Item Loss View */}
      {activeTab === "Item Loss" && (
        <div className="animate-in fade-in duration-300">
          <ItemLossTab 
            isIngredientsBased={isIngredientsBased}
            refundsData={refundsData}
            refundItemsData={refundItemsData}
            usersData={usersData}
            productsList={productsList}
            ingredientsData={ingredientsData}
            recipesData={recipesData}
          />
        </div>
      )}

      {/* 9. Reconciliations View */}
      {activeTab === "Reconciliations" && (
        <div className="animate-in fade-in duration-300">
          <ReconciliationsTab 
            reconciliations={reconciliations}
            reconItems={reconItems}
            ingredients={ingredientsData}
            usersData={usersData}
            isIngredientsBased={isIngredientsBased}
          />
        </div>
      )}

      {/* 10. Global Report View */}
      {activeTab === "Global Report" && (
        <div className="animate-in fade-in duration-300">
          <GlobalReportTab 
            productsList={productsList}
            categoriesList={categoriesList}
          />
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== "Business Insights" && activeTab !== "Sales History" && activeTab !== "Refunds" && activeTab !== "Shift History" && activeTab !== "Deliveries" && activeTab !== "Item Loss" && activeTab !== "Reconciliations" && activeTab !== "Global Report" && (
        <Card className="border-dashed">
          <CardContent className="py-24 text-center text-gray-500 flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{activeTab}</h3>
            <p className="max-w-sm">
              The data table for {activeTab} will appear here, properly filtered by your selected date range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
