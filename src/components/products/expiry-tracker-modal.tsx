"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, CheckCircle2, MoreHorizontal, FileWarning } from "lucide-react";
import { addExpiryBatchAction, toggleProductExpiryTrackingAction, writeOffExpiryBatchAction, deleteExpiryBatchAction } from "@/app/actions/expiry";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
      {pending ? "Adding..." : "Add Batch"}
    </Button>
  );
}

export function ExpiryTrackerModal({ 
  open, 
  onOpenChange, 
  product, 
  batches 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  product: any, 
  batches: any[] 
}) {
  const [state, formAction] = useActionState(addExpiryBatchAction, null);
  const [isAdding, setIsAdding] = useState(false);
  const [showWrittenOff, setShowWrittenOff] = useState(false);
  const [trackExpiry, setTrackExpiry] = useState(product?.trackExpiry || false);
  const [confirmWriteOffId, setConfirmWriteOffId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (open && product) {
      setTrackExpiry(product.trackExpiry || false);
      setIsAdding(false);
    }
  }, [open, product]);

  useEffect(() => {
    if (state?.success) {
      setIsAdding(false);
    }
  }, [state]);

  const handleToggleTracking = async () => {
    const newState = !trackExpiry;
    setTrackExpiry(newState);
    await toggleProductExpiryTrackingAction(product.id, newState);
  };

  if (!product) return null;

  const activeBatches = batches.filter(b => b.isWrittenOff === 0);
  const writtenOffBatches = batches.filter(b => b.isWrittenOff === 1);

  const getDaysRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (days: number) => {
    if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, color: "bg-red-50 text-red-700 border-red-200", icon: "🚨" };
    if (days <= 3) return { text: `${days}d left`, color: "bg-red-50 text-red-700 border-red-200", icon: "🚨" };
    if (days <= 7) return { text: `${days}d left`, color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⚠️" };
    if (days <= 30) return { text: `${days}d left`, color: "bg-amber-50 text-amber-700 border-amber-200", icon: "" };
    return { text: `${days}d left`, color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅" };
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gray-50 flex flex-col max-h-[85vh]">
        <div className="shrink-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">{product.name}</h2>
            <div 
              onClick={handleToggleTracking}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${trackExpiry ? 'bg-[#FD6708]' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trackExpiry ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Track expiry dates to prevent waste. This does not automatically update stock.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!trackExpiry && (
            <div className="p-6 text-center border border-dashed rounded-xl bg-white">
              <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Expiry tracking is disabled.</p>
              <p className="text-xs text-gray-400 mt-1">Turn on the toggle above to start tracking batches.</p>
            </div>
          )}

          {trackExpiry && (
            <>
              {isAdding ? (
                <div className="bg-white p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-2">
                  <form action={formAction} className="space-y-4">
                    <input type="hidden" name="productId" value={product.id} />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">Quantity</label>
                        <Input type="number" name="quantity" min="1" required placeholder="e.g., 50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">Expiry Date</label>
                        <Input type="date" name="expiryDate" required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500">Notes (Optional)</label>
                      <Input name="notes" placeholder="e.g., Shelf B" />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                      <SubmitButton />
                    </div>
                  </form>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsAdding(true)} 
                  variant="outline" 
                  className="w-full border-dashed border-2 py-6 text-gray-500 hover:text-gray-900 hover:border-gray-300"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Expiry Batch
                </Button>
              )}

              <div className="space-y-3 pt-2">
                {activeBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(batch => {
                  const days = getDaysRemaining(batch.expiryDate);
                  const status = getStatusInfo(days);
                  
                  return (
                    <div key={batch.id} className={`p-4 rounded-xl border flex items-center justify-between ${status.color}`}>
                      <div>
                        <div className="font-semibold">{status.icon} {status.text}</div>
                        <div className="text-xs mt-1 opacity-80">
                          Qty: {batch.quantity} • Expires: {batch.expiryDate}
                        </div>
                        {batch.notes && <div className="text-[10px] mt-1 opacity-70 border-t border-black/10 pt-1 w-fit">{batch.notes}</div>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-70 hover:opacity-100 hover:bg-black/5">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirmWriteOffId(batch.id)} className="text-red-600 font-medium">
                            <FileWarning className="h-4 w-4 mr-2" /> Write Off
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDeleteId(batch.id)} className="text-gray-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>

              {writtenOffBatches.length > 0 && (
                <div className="pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowWrittenOff(!showWrittenOff)}
                    className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <span>Written-Off Batches ({writtenOffBatches.length})</span>
                    <span>{showWrittenOff ? '▲' : '▼'}</span>
                  </button>
                  
                  {showWrittenOff && (
                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                      {writtenOffBatches.map(batch => (
                        <div key={batch.id} className="p-3 rounded-lg border bg-gray-100 text-gray-500 flex justify-between items-center opacity-70">
                          <div>
                            <div className="text-xs font-semibold line-through">Qty: {batch.quantity}</div>
                            <div className="text-[10px]">Written off on {formatDate(new Date(batch.writtenOffAt).getTime())}</div>
                          </div>
                          <div className="text-[10px]">{batch.expiryDate}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmWriteOffId !== null} onOpenChange={(open) => !open && setConfirmWriteOffId(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Write Off Batch?</DialogTitle>
          <DialogDescription>
            Are you sure you want to write off this expired batch? This action cannot be undone and will permanently move it to the written-off history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setConfirmWriteOffId(null)}>
            No, Cancel
          </Button>
          <Button variant="destructive" onClick={async () => {
            if (confirmWriteOffId) await writeOffExpiryBatchAction(confirmWriteOffId);
            setConfirmWriteOffId(null);
          }}>
            Yes, Write Off
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Batch?</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this batch record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={async () => {
            if (confirmDeleteId) await deleteExpiryBatchAction(confirmDeleteId);
            setConfirmDeleteId(null);
          }}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
