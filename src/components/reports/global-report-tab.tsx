"use client";

import { useState } from "react";
import { formatPeso } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, ShieldAlert, AlertCircle, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { verifyPinAction } from "@/app/actions/reports";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function GlobalReportTab({ productsList, categoriesList }: any) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await verifyPinAction(pin);
      if (res.success) {
        setIsUnlocked(true);
      } else {
        setError(res.error || "Invalid PIN");
        setPin("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Calculate the 3 Global Metrics (Only items in stock)
  const inStockProducts = productsList.filter((p: any) => Number(p.stock) > 0);
  
  const potentialRevenue = inStockProducts.reduce((sum: number, p: any) => sum + (Number(p.stock) * Number(p.price)), 0);
  const totalInventoryValue = inStockProducts.reduce((sum: number, p: any) => sum + (Number(p.stock) * Number(p.costPrice || 0)), 0);
  const potentialProfit = potentialRevenue - totalInventoryValue;

  // 2. Prepare Donut Chart Data (Capital Breakdown by Category)
  const catMap: Record<number, string> = {};
  categoriesList.forEach((c: any) => catMap[c.id] = c.name);
  
  const categoryCapital: Record<string, number> = {};
  inStockProducts.forEach((p: any) => {
    const catName = p.categoryId ? catMap[p.categoryId] : "Uncategorized";
    const capital = Number(p.stock) * Number(p.costPrice || 0);
    if (capital > 0) {
      categoryCapital[catName] = (categoryCapital[catName] || 0) + capital;
    }
  });
  
  const chartData = Object.entries(categoryCapital)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. Prepare Top 5 Capital Ties (Dead Stock)
  const topDeadStock = [...inStockProducts]
    .map(p => ({
      ...p,
      capitalTied: Number(p.stock) * Number(p.costPrice || 0)
    }))
    .sort((a, b) => b.capitalTied - a.capitalTied)
    .slice(0, 5);

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto mt-12 border-dashed border-2 shadow-sm">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-50/50">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Secured Financial Report</h2>
          <p className="text-sm text-gray-500 mb-8">This report contains sensitive financial snapshot data and physical asset valuations. Please enter your PIN to unlock the dashboard.</p>
          
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <div className="space-y-2 text-left">
              <Input 
                type="password" 
                inputMode="numeric"
                placeholder="Enter PIN" 
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="text-center tracking-widest text-lg h-12"
                disabled={isLoading}
              />
              {error && <div className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {error}</div>}
            </div>
            <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800" disabled={isLoading || pin.length < 4}>
              {isLoading ? "Verifying..." : "Unlock Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <ShieldAlert className="h-4 w-4 text-emerald-600" />
          <span>Dashboard Unlocked for this session</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsUnlocked(false)} className="text-gray-500 hover:text-gray-900">
          <Lock className="h-4 w-4 mr-2" /> Lock
        </Button>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatPeso(potentialRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">If all current stock is sold</p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatPeso(totalInventoryValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Total cost of goods sitting in store</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Potential Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatPeso(potentialProfit)}</div>
            <p className="text-xs text-gray-500 mt-1">Net profit after selling all stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capital Breakdown Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gray-400" /> Capital Breakdown by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
                No inventory data available
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatPeso(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Dead Stock Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Products Holding Capital</CardTitle>
          </CardHeader>
          <CardContent>
            {topDeadStock.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border border-dashed rounded-lg">
                No inventory data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 border-b uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Product</th>
                      <th className="px-4 py-3 font-medium text-right">In Stock</th>
                      <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Capital Tied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topDeadStock.map((product: any, idx: number) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">{idx + 1}</div>
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {product.stock} <span className="text-[10px] text-gray-400 ml-1">x {formatPeso(Number(product.costPrice || 0))}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatPeso(product.capitalTied)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
