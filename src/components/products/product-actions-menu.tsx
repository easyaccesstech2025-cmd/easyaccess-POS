"use client";

import { MoreHorizontal, Edit, PackagePlus, Archive, RotateCcw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export function ProductActionsMenu({ 
  product, 
  onAction
}: { 
  product: any, 
  onAction: (action: "edit" | "delivery" | "expiry" | "archive") => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction("edit")}>
          <Edit className="h-4 w-4 mr-2" /> Edit Product
        </DropdownMenuItem>
        
        {/* Hide delivery for Recipe products just like Android app! */}
        {!product.isRecipe && !product.isArchived && (
          <>
            <DropdownMenuItem onClick={() => onAction("delivery")}>
              <PackagePlus className="h-4 w-4 mr-2" /> Receive Delivery
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("expiry")}>
              <Calendar className="h-4 w-4 mr-2 text-orange-600" /> Track Expiry
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("archive")} className={product.isArchived ? "text-emerald-600" : "text-red-600"}>
          {product.isArchived ? (
            <><RotateCcw className="h-4 w-4 mr-2" /> Restore Product</>
          ) : (
            <><Archive className="h-4 w-4 mr-2" /> Archive Product</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
