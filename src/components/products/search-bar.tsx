"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(searchParams.get("q") || "");

  // Debounce the search if typing fast
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    // Prevent infinite loop: only navigate if the input term differs from the URL
    if (term === currentQ) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (term) {
          params.set("q", term);
        } else {
          params.delete("q");
        }
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [term, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <Input 
        type="text" 
        placeholder={placeholder} 
        className="pl-9"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#FD6708] border-r-transparent" />
        </div>
      )}
    </div>
  );
}
