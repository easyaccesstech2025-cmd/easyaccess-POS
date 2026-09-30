"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  
  // Format pathname to a readable title
  const title = pathname
    .split("/")
    .filter(Boolean)[0]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()) || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
        <button 
          onClick={onMenuClick} 
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:text-gray-900"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-none truncate">{title}</h1>
        
        <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6">

          <div className="flex items-center gap-x-4">
            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#FD6708]"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
