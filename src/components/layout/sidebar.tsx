"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  DollarSign,
  Package,
  List,
  Calendar,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ShoppingBag,
  X,
  ClipboardCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { name: "Cash Drawer", href: "/cashdrawer", icon: DollarSign },
  { name: "Products", href: "/products", icon: Package },
  { name: "Ingredients", href: "/ingredients", icon: List },
  { name: "Expiry Tracker", href: "/expiry", icon: Calendar },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  return (
    <div className="flex h-screen w-64 flex-col bg-[#171D2D] text-white fixed left-0 top-0">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FD6708]">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight truncate">Easy Access POS</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-1 -mr-2 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isIngredientsBased = (session?.user as any)?.companyType?.toLowerCase().includes("ingredients") ?? false;
          if (item.name === "Ingredients" && !isIngredientsBased) return null;

          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#FD6708] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300")} />
                {item.name}
              </div>
              {isActive && (
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  Selected
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold uppercase text-white shadow-sm">
            {session?.user?.name?.[0] || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate max-w-[100px]">
              {session?.user?.name || "User"}
            </span>
            <span className="text-xs text-gray-400">
              {(session?.user as any)?.role || "Role"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </button>
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] text-gray-900">
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              No, Cancel
            </Button>
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
              Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
