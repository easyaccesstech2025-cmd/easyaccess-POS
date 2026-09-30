"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { openShiftAction, closeShiftAction, addCashTransactionAction } from "@/app/actions/cashdrawer";
import { toast } from "sonner";
import { Calculator, DollarSign, LogIn, LogOut, Plus, Minus, FileText, ArrowRight, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function CashDrawerClient({ activeSession, transactions, orders, refunds, history, openedByName }: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    setLastSynced(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleSync(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = (isAuto = false) => {
    if (!isAuto) setIsSyncing(true);
    startTransition(() => {
      router.refresh();
      setLastSynced(new Date());
      if (!isAuto) setTimeout(() => setIsSyncing(false), 500);
    });
  };


  // Modals state
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [isConfirmCloseModal, setIsConfirmCloseModal] = useState(false);
  const [isHistoryModal, setIsHistoryModal] = useState(false);
  const [isTransactionModal, setIsTransactionModal] = useState<'CASH_ADDED' | 'EXPENSE' | null>(null);

  // Form states
  const [startingCash, setStartingCash] = useState("");
  const [actualCashCounted, setActualCashCounted] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [emailReport, setEmailReport] = useState(true);

  // Mathematics
  let startingCashNum = 0;
  let cashAdded = 0;
  let cashExpenses = 0;
  let cashSales = 0;
  let digitalSales = 0;
  let serviceFees = 0;
  let deliveryFees = 0;
  let cashRefunds = 0;
  let totalSales = 0;
  let expectedCash = 0;
  const digitalBreakdown: Record<string, number> = {};
  
  if (activeSession) {
    startingCashNum = parseFloat(activeSession.startingCash) || 0;

    transactions.forEach((tx: any) => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.transactionType === 'CASH_ADDED') cashAdded += amt;
      if (tx.transactionType === 'EXPENSE') cashExpenses += amt;
    });

    orders.forEach((o: any) => {
      const totAmt = parseFloat(o.totalAmount) || 0;
      totalSales += totAmt;

      if (o.paymentMethod === 'CASH') {
        cashSales += totAmt;
      } else if (o.paymentMethod === 'SPLIT') {
        cashSales += (parseFloat(o.splitCashAmount) || 0);
        const digAmt = (parseFloat(o.splitDigitalAmount) || 0);
        digitalSales += digAmt;
        const method = o.splitDigitalMethod || 'Other Digital';
        digitalBreakdown[method] = (digitalBreakdown[method] || 0) + digAmt;
      } else {
        digitalSales += totAmt;
        const method = o.splitDigitalMethod || 'Other Digital';
        digitalBreakdown[method] = (digitalBreakdown[method] || 0) + totAmt;
      }

      serviceFees += (parseFloat(o.serviceFee) || 0);
      deliveryFees += (parseFloat(o.deliveryFee) || 0);
    });

    refunds.forEach((r: any) => {
      cashRefunds += (parseFloat(r.totalRefunded) || 0);
    });

    expectedCash = startingCashNum + cashAdded + cashSales - cashExpenses - cashRefunds;
  }

  // Handlers
  const handleOpenShift = () => {
    if (!startingCash) return;
    startTransition(async () => {
      const res = await openShiftAction(parseFloat(startingCash));
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Shift opened successfully.");
        setIsOpenShiftModal(false);
        setStartingCash("");
      }
    });
  };

  const handleCloseShift = () => {
    if (!actualCashCounted) return;
    startTransition(async () => {
      const res = await closeShiftAction(activeSession.id, parseFloat(actualCashCounted));
      if (res?.error) toast.error(res.error);
      else {
        if (emailReport) {
          toast.success("Shift closed successfully.", { description: "Z-Reading Report has been emailed to the Master Admin." });
        } else {
          toast.success("Shift closed successfully.");
        }
        
        if (printReceipt) {
          setTimeout(() => {
            window.print(); // Trigger the Z-Reading print fallback
          }, 500);
        }
        
        setIsCloseShiftModal(false);
        setActualCashCounted("");
      }
    });
  };

  const handleAddTransaction = () => {
    if (!txAmount || !isTransactionModal) return;
    startTransition(async () => {
      const res = await addCashTransactionAction(activeSession.id, isTransactionModal, parseFloat(txAmount), txDescription);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isTransactionModal === 'CASH_ADDED' ? "Cash added." : "Expense recorded.");
        setIsTransactionModal(null);
        setTxAmount("");
        setTxDescription("");
      }
    });
  };

  if (!activeSession) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cash Drawer</h1>
          <Button variant="ghost" size="icon" className={cn("text-gray-500 hover:text-gray-900 border", isSyncing && "animate-spin")} onClick={() => handleSync(false)} title="Sync Now">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        <Card className="text-center py-16 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <Calculator className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Active Shift</h2>
            <p className="text-gray-500 max-w-sm mx-auto">You must open a shift and declare the starting cash in the drawer before you can process sales.</p>
            <Button size="lg" className="mt-4 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all" onClick={() => setIsOpenShiftModal(true)}>
              <LogIn className="w-5 h-5 mr-2" /> Open New Shift
            </Button>
          </CardContent>
        </Card>
        
        <Dialog open={isOpenShiftModal} onOpenChange={setIsOpenShiftModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open New Shift</DialogTitle>
              <DialogDescription>Count the physical cash in the drawer to establish the starting float.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Starting Cash Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input type="number" placeholder="0.00" className="pl-9 text-lg" value={startingCash} onChange={e => setStartingCash(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsOpenShiftModal(false)}>Cancel</Button>
              <Button onClick={handleOpenShift} disabled={isPending || !startingCash} className="bg-blue-600">Start Shift</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Active shift view
  const variance = parseFloat(actualCashCounted || "0") - expectedCash;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Cash Drawer
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">OPEN</Badge>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex-1 sm:flex-none w-full sm:w-auto" onClick={() => setIsTransactionModal('CASH_ADDED')}>
            <Plus className="w-4 h-4 mr-2" /> Add Cash
          </Button>
          <Button variant="outline" className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100 flex-1 sm:flex-none w-full sm:w-auto" onClick={() => setIsTransactionModal('EXPENSE')}>
            <Minus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
          <Button variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 flex-1 sm:flex-none w-full sm:w-auto" onClick={() => setIsHistoryModal(true)}>
            <FileText className="w-4 h-4 mr-2" /> View Transactions
          </Button>
          <Button variant="ghost" size="icon" className={cn("text-gray-500 hover:text-gray-900 border", isSyncing && "animate-spin")} onClick={() => handleSync(false)} title="Sync Now">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* DETAILS BLOCK */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Details</h3>
              {lastSynced && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Auto-sync active (Last: {lastSynced.toLocaleTimeString()})
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Session ID</p>
                <p className="font-semibold">#{activeSession.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Opened by</p>
                <p className="font-semibold">{openedByName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Opened at</p>
                <p className="font-semibold">{new Date(activeSession.openedAtMs).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Starting Cash</p>
                <p className="font-semibold text-emerald-600">₱{startingCashNum.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SHIFT SUMMARY */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Shift Summary (Live)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cash Sales (incl. fees)</p>
                <p className="font-medium">₱{cashSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Digital Sales</p>
                <p className="font-medium">₱{digitalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Sales</p>
                <p className="font-medium text-emerald-600">₱{totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Refunds</p>
                <p className="font-medium text-red-600">-₱{cashRefunds.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Fees</p>
                <p className="font-medium">₱{serviceFees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery Fees</p>
                <p className="font-medium">₱{deliveryFees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cash Added</p>
                <p className="font-medium text-blue-600">₱{cashAdded.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cash Expenses</p>
                <p className="font-medium text-red-600">-₱{cashExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        
        

        {/* EXPECTED CASH */}
        <Card className="shadow-sm border-blue-200 overflow-hidden bg-blue-50/50">
          <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Expected Cash In Drawer</p>
              <h2 className="text-5xl font-black text-blue-900">₱{expectedCash.toFixed(2)}</h2>
            </div>
            
            <Button size="lg" className="bg-gray-900 hover:bg-black w-full md:w-auto shrink-0 shadow-lg" onClick={() => setIsCloseShiftModal(true)}>
              <LogOut className="w-5 h-5 mr-2" /> Close Shift (Z-Reading)
            </Button>
          </div>
        </Card>

      </div>

      
      {/* HISTORY MODAL */}
      <Dialog open={isHistoryModal} onOpenChange={setIsHistoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recent Transactions</DialogTitle>
            <DialogDescription>List of all cash additions and expenses during this shift.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="overflow-y-auto max-h-[300px] border rounded-md border-gray-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No cash additions or expenses recorded yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {transactions.map((tx: any) => (
                    <li key={tx.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tx.transactionType === 'CASH_ADDED' ? 'Add Cash' : 'Add Expense'}</p>
                        {tx.description && <p className="text-xs text-gray-500">{tx.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", tx.transactionType === 'CASH_ADDED' ? "text-emerald-600" : "text-red-600")}>
                          {tx.transactionType === 'CASH_ADDED' ? '+' : '-'}₱{parseFloat(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.createdAtMs).toLocaleTimeString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      {/* Z-READING MODAL */}
      <Dialog open={isCloseShiftModal} onOpenChange={setIsCloseShiftModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <div className="bg-gray-900 text-white p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-xl">Z-Reading Report</DialogTitle>
              <DialogDescription className="text-gray-400">Shift #{activeSession?.id} • {openedByName}</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 -mt-4 min-h-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-6">
              
              {/* Sales Summary */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Sales Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Cash Sales</span><span className="font-medium">₱{cashSales.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Digital Sales</span><span className="font-medium">₱{digitalSales.toFixed(2)}</span></div>
                  {Object.entries(digitalBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between pl-4 text-xs"><span className="text-gray-400">↳ {method}</span><span className="text-gray-500">₱{(amount as number).toFixed(2)}</span></div>
                  ))}
                  <div className="flex justify-between pt-2 border-t font-bold"><span className="text-gray-900">Total Sales</span><span className="text-emerald-700">₱{totalSales.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Adjustments */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Adjustments</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Cash Added (Pay Ins)</span><span className="font-medium text-blue-600">+ ₱{cashAdded.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Expenses (Pay Outs)</span><span className="font-medium text-red-600">- ₱{cashExpenses.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Refunds</span><span className="font-medium text-red-600">- ₱{cashRefunds.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Expected Cash */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Expected Cash</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-blue-600">Starting Float</span>
                  <span className="text-sm font-medium text-blue-800">₱{startingCashNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
                  <span className="font-bold text-blue-900">Total Expected</span>
                  <span className="text-xl font-black text-blue-900">₱{expectedCash.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-blue-500 mt-2 italic text-center">Starting Cash + Cash Sales + Added - Expenses - Refunds</p>
              </div>

              {/* Discrepancy */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Drawer Count</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Actual Cash Counted</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400 font-bold">₱</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-8 text-xl font-bold h-12 focus-visible:ring-gray-900" 
                        value={actualCashCounted} 
                        onChange={e => setActualCashCounted(e.target.value)} 
                      />
                    </div>
                  </div>

                  {actualCashCounted && (
                    <div className={cn("p-4 rounded-md flex justify-between items-center border", variance === 0 ? "bg-emerald-50 border-emerald-200" : (variance < 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"))}>
                      <span className={cn("text-sm font-bold", variance === 0 ? "text-emerald-700" : (variance < 0 ? "text-red-700" : "text-blue-700"))}>
                        {variance === 0 ? "BALANCED" : (variance < 0 ? "SHORT (Missing Cash)" : "OVER (Extra Cash)")}
                      </span>
                      <span className={cn("text-xl font-black", variance === 0 ? "text-emerald-700" : (variance < 0 ? "text-red-700" : "text-blue-700"))}>
                        {variance > 0 ? "+" : ""}{variance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex gap-4 text-sm font-medium w-full sm:w-auto bg-white p-2 rounded-md border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input type="checkbox" checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} className="w-4 h-4 rounded text-gray-900 border-gray-300" />
                Print Receipt
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input type="checkbox" checked={emailReport} onChange={e => setEmailReport(e.target.checked)} className="w-4 h-4 rounded text-gray-900 border-gray-300" />
                Email Report
              </label>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => setIsCloseShiftModal(false)}>Cancel</Button>
              <Button 
                onClick={() => setIsConfirmCloseModal(true)} 
                disabled={isPending || !actualCashCounted} 
                className="bg-gray-900 hover:bg-black flex-1 sm:flex-none"
              >
                <LogOut className="w-4 h-4 mr-2" /> Confirm & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* TRANSACTION MODAL */}
      <Dialog open={!!isTransactionModal} onOpenChange={(open) => !open && setIsTransactionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isTransactionModal === 'CASH_ADDED' ? "Add Cash" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              {isTransactionModal === 'CASH_ADDED' ? "Record extra physical cash added to the drawer." : "Record cash removed from the drawer for expenses."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input type="number" placeholder="0.00" className="pl-9" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description {isTransactionModal === 'EXPENSE' && "(Required)"}</label>
              <Input type="text" placeholder="e.g. Store supplies" value={txDescription} onChange={e => setTxDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTransactionModal(null)}>Cancel</Button>
            <Button 
              onClick={handleAddTransaction} 
              disabled={isPending || !txAmount || (isTransactionModal === 'EXPENSE' && !txDescription)} 
              className={isTransactionModal === 'CASH_ADDED' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isTransactionModal === 'CASH_ADDED' ? "Add Cash" : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* CONFIRM CLOSE MODAL */}
      <Dialog open={isConfirmCloseModal} onOpenChange={setIsConfirmCloseModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Confirm Shift Closure
            </DialogTitle>
            <DialogDescription className="pt-2 text-gray-700">
              Are you sure? This action cannot be undone. This shift will be permanently closed and a Z-Reading will be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsConfirmCloseModal(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setIsConfirmCloseModal(false);
                handleCloseShift();
              }} 
              disabled={isPending} 
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


