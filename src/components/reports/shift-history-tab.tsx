"use client";

import { useState } from "react";
import { formatPeso, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Printer, AlertTriangle, CheckCircle2 } from "lucide-react";

export function ShiftHistoryTab({ sessionsData, cashTxData, ordersData, itemsData, refundsData, usersData }: any) {
  const [activeSession, setActiveSession] = useState<any>(null);

  const userMap: Record<number, string> = {};
  usersData.forEach((u: any) => userMap[u.id] = u.name || "Unknown User");

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)]">
      {/* LEFT: MASTER LIST */}
      <Card className={cn("flex-1 flex-col overflow-hidden border shadow-sm", activeSession ? "hidden lg:flex" : "flex")}>
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="font-semibold text-gray-700">Recent Shift History</h3>
        </div>

        <div className="overflow-auto flex-1 bg-gray-50/30 p-4 space-y-3">
          {sessionsData.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg border border-dashed">
              No shifts found for this period.
            </div>
          ) : sessionsData.map((session: any) => {
            const isActive = activeSession?.id === session.id;
            
            // Calculate basic totals for the card preview
            const sessionOrders = ordersData.filter((o: any) => o.sessionId === session.id);
            const totalRevenue = sessionOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
            
            // Calculate variance
            const startingCash = Number(session.startingCash || 0);
            const cashTxs = cashTxData.filter((ct: any) => ct.sessionId === session.id);
            const cashAdded = cashTxs.filter((ct: any) => ct.transactionType === "ADD").reduce((sum: number, ct: any) => sum + Number(ct.amount), 0);
            const cashExp = cashTxs.filter((ct: any) => ct.transactionType === "EXPENSE").reduce((sum: number, ct: any) => sum + Number(ct.amount), 0);
            
            const cashSales = sessionOrders.filter((o: any) => o.paymentMethod === "CASH").reduce((sum: number, o: any) => sum + Number(o.amountReceived || o.totalAmount), 0) - sessionOrders.filter((o: any) => o.paymentMethod === "CASH").reduce((sum: number, o: any) => sum + Number(o.changeGiven || 0), 0);
            const cashRefunds = refundsData.filter((r: any) => r.sessionId === session.id).reduce((sum: number, r: any) => sum + Number(r.totalRefunded), 0);
            
            const expectedCash = startingCash + cashAdded + cashSales - cashExp - cashRefunds;
            const actualCash = Number(session.actualCashCounted || 0);
            const variance = actualCash - expectedCash;
            const isShort = variance < 0 && session.status === "CLOSED";

            return (
              <div 
                key={session.id} 
                onClick={() => setActiveSession(session)}
                className={cn(
                  "bg-white p-4 rounded-xl border shadow-sm cursor-pointer hover:border-[#FD6708] hover:shadow-md transition-all group",
                  isActive ? "ring-2 ring-[#FD6708] border-transparent" : "",
                  isShort ? "border-red-200" : ""
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-[#FD6708]">Shift #{session.id}</div>
                    <div className="text-xs text-gray-500 font-medium">{userMap[session.openedBy]}</div>
                  </div>
                  {session.status === "OPEN" ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ongoing</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">Closed</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Opened:</span>
                    <span>{new Date(session.openedAtMs).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closed:</span>
                    <span>{session.closedAtMs ? new Date(session.closedAtMs).toLocaleString() : "-"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                  <div className="text-lg font-bold text-gray-900">{formatPeso(totalRevenue)}</div>
                  {isShort && (
                    <div className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Short: {formatPeso(Math.abs(variance))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RIGHT: Z-READING PREVIEW (DETAIL) */}
      <Card className={cn("w-full lg:w-[450px] shrink-0 flex-col border bg-[#fdfdfd] shadow-md relative overflow-hidden", !activeSession ? "hidden lg:flex" : "flex")}>
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Printer className="h-6 w-6 text-gray-300" />
            </div>
            <p>Select a shift from the list to view its detailed Z-Reading</p>
          </div>
        ) : (
          (() => {
            // Recalculate full Z-Reading for active session
            const sessionOrders = ordersData.filter((o: any) => o.sessionId === activeSession.id);
            const totalRevenue = sessionOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
            
            const startingCash = Number(activeSession.startingCash || 0);
            const cashTxs = cashTxData.filter((ct: any) => ct.sessionId === activeSession.id);
            const cashAdded = cashTxs.filter((ct: any) => ct.transactionType === "ADD").reduce((sum: number, ct: any) => sum + Number(ct.amount), 0);
            const cashExp = cashTxs.filter((ct: any) => ct.transactionType === "EXPENSE").reduce((sum: number, ct: any) => sum + Number(ct.amount), 0);
            
            const cashSales = sessionOrders.filter((o: any) => o.paymentMethod === "CASH").reduce((sum: number, o: any) => sum + Number(o.amountReceived || o.totalAmount), 0) - sessionOrders.filter((o: any) => o.paymentMethod === "CASH").reduce((sum: number, o: any) => sum + Number(o.changeGiven || 0), 0);
            const digitalSales = sessionOrders.filter((o: any) => o.paymentMethod !== "CASH").reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
            
            const cashRefunds = refundsData.filter((r: any) => r.sessionId === activeSession.id).reduce((sum: number, r: any) => sum + Number(r.totalRefunded), 0);
            
            const expectedCash = startingCash + cashAdded + cashSales - cashExp - cashRefunds;
            const actualCash = Number(activeSession.actualCashCounted || 0);
            const variance = actualCash - expectedCash;
            
            return (
              <>
                <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 relative">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={() => setActiveSession(null)}>
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <h3 className="font-semibold flex items-center gap-2">
                      Z-Reading
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print Z-Reading">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Z-Reading Print Area */}
                <div className="flex-1 overflow-auto p-6 bg-[#f4f4f5] receipt-print-area">
                  <div className="bg-white p-6 shadow-sm max-w-sm mx-auto font-mono text-sm border-t-8 border-t-gray-800">
                    <div className="text-center mb-6">
                      <h2 className="font-bold text-xl uppercase tracking-widest mb-1">Z-READING</h2>
                      <div className="text-gray-500 text-xs">END OF SHIFT REPORT</div>
                    </div>

                    <div className="border-b border-dashed border-gray-300 pb-4 mb-4 text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Shift ID:</span>
                        <span className="font-medium text-gray-900">#{activeSession.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cashier:</span>
                        <span className="font-medium text-gray-900">{userMap[activeSession.openedBy]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Opened:</span>
                        <span>{new Date(activeSession.openedAtMs).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed:</span>
                        <span>{activeSession.closedAtMs ? new Date(activeSession.closedAtMs).toLocaleString() : "ONGOING"}</span>
                      </div>
                    </div>

                    {/* Sales Summary */}
                    <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4">
                      <div className="font-bold mb-2">SALES SUMMARY</div>
                      <div className="flex justify-between">
                        <span>Gross Cash Sales</span>
                        <span>{formatPeso(cashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gross Digital Sales</span>
                        <span>{formatPeso(digitalSales)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 mt-1 border-t border-gray-100">
                        <span>TOTAL REVENUE</span>
                        <span>{formatPeso(totalRevenue)}</span>
                      </div>
                    </div>

                    {/* Cash Drawer Accountability */}
                    <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4">
                      <div className="font-bold mb-2">CASH DRAWER</div>
                      <div className="flex justify-between text-gray-600">
                        <span>Starting Cash</span>
                        <span>{formatPeso(startingCash)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>(+) Cash Added</span>
                        <span>{formatPeso(cashAdded)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>(+) Cash Sales</span>
                        <span>{formatPeso(cashSales)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>(-) Cash Expenses</span>
                        <span className="text-red-500">-{formatPeso(cashExp)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>(-) Cash Refunds</span>
                        <span className="text-red-500">-{formatPeso(cashRefunds)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 mt-1 border-t border-gray-200">
                        <span>EXPECTED CASH</span>
                        <span>{formatPeso(expectedCash)}</span>
                      </div>
                    </div>

                    {/* Blind Drop / Variance */}
                    <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4 bg-gray-50 p-3 rounded">
                      <div className="flex justify-between font-bold">
                        <span>ACTUAL COUNTED</span>
                        <span>{activeSession.status === "OPEN" ? "-" : formatPeso(actualCash)}</span>
                      </div>
                      {activeSession.status === "CLOSED" && (
                        <div className="flex justify-between font-bold pt-2">
                          <span>VARIANCE</span>
                          <span className={variance < 0 ? "text-red-600" : variance > 0 ? "text-blue-600" : "text-emerald-600"}>
                            {variance === 0 ? "EXACT" : variance < 0 ? `SHORT (${formatPeso(Math.abs(variance))})` : `OVER (${formatPeso(variance)})`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 text-center text-gray-400 text-[10px]">
                      *** END OF REPORT ***
                    </div>
                  </div>
                </div>
              </>
            );
          })()
        )}
      </Card>
    </div>
  );
}
