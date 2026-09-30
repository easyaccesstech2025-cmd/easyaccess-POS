"use client";

import { useState, useTransition } from "react";
import { writeOffExpiryBatchAction } from "@/app/actions/expiry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ExpiryWriteOffButton({ batchId }: { batchId: number }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      await writeOffExpiryBatchAction(batchId);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="text-xs text-red-600 hover:text-red-800 underline mt-1 disabled:opacity-50"
      >
        {isPending ? "Writing off..." : "Write Off"}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Write Off Batch?</DialogTitle>
            <DialogDescription>
              Are you sure you want to write off this expired batch? This action cannot be undone and will permanently move it to the written-off history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              No, Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Writing off..." : "Yes, Write Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
