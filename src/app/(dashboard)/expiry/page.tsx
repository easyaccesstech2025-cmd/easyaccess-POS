import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { dbPos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ExpiryWriteOffButton } from "./expiry-client";

export default async function ExpiryTrackerPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/login");
  const userId = parseInt(session.user.id);

  // 1. Fetch active batches
  const activeBatches = await dbPos.select()
    .from(schema.productExpiryBatch)
    .where(and(eq(schema.productExpiryBatch.userId, userId), eq(schema.productExpiryBatch.isWrittenOff, 0)));

  // 2. Fetch tracked products
  const trackedProducts = await dbPos.select()
    .from(schema.products)
    .where(and(eq(schema.products.userId, userId), eq(schema.products.trackExpiry, true)));

  // Map product names to batches
  const batchesWithProducts = activeBatches.map(batch => {
    const product = trackedProducts.find(p => p.id === batch.productId);
    
    const expiry = new Date(batch.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...batch,
      productName: product?.name || "Unknown Product",
      days
    };
  }).sort((a, b) => a.days - b.days);

  const expiredBatches = batchesWithProducts.filter(b => b.days < 0);
  const soonBatches = batchesWithProducts.filter(b => b.days >= 0 && b.days <= 7);
  const safeBatches = batchesWithProducts.filter(b => b.days > 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Expiry Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Manage global product expiration batches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Expired Items */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
            <CardTitle className="text-red-700 flex justify-between items-center text-lg">
              Expired
              <Badge variant="destructive" className="ml-2">{expiredBatches.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {expiredBatches.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No expired items.</div>
              )}
              {expiredBatches.map(batch => (
                <div key={batch.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{batch.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {batch.quantity}</p>
                    {batch.notes && <p className="text-[10px] text-gray-400 mt-1">{batch.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">Expired {Math.abs(batch.days)}d ago</p>
                    <ExpiryWriteOffButton batchId={batch.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="border-amber-200">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
            <CardTitle className="text-amber-700 flex justify-between items-center text-lg">
              Expiring Soon
              <Badge variant="warning" className="ml-2">{soonBatches.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {soonBatches.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No items expiring soon.</div>
              )}
              {soonBatches.map(batch => (
                <div key={batch.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{batch.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {batch.quantity}</p>
                    {batch.notes && <p className="text-[10px] text-gray-400 mt-1">{batch.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">{batch.days === 0 ? "Expires today" : `In ${batch.days} days`}</p>
                    <ExpiryWriteOffButton batchId={batch.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safe Items */}
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <CardTitle className="text-emerald-700 flex justify-between items-center text-lg">
              Safe
              <Badge variant="success" className="ml-2">{safeBatches.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {safeBatches.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No safe batches tracked.</div>
              )}
              {safeBatches.map(batch => (
                <div key={batch.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{batch.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {batch.quantity}</p>
                    {batch.notes && <p className="text-[10px] text-gray-400 mt-1">{batch.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{batch.days} days left</p>
                    <ExpiryWriteOffButton batchId={batch.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
