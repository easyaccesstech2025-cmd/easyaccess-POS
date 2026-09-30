import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="flex flex-col items-center gap-6 p-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/20">
        
        {/* Cool Glowing Spinner */}
        <div className="relative flex items-center justify-center">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full blur-xl bg-[#FD6708]/30 animate-pulse scale-150"></div>
          
          {/* Inner spinning icon */}
          <Loader2 className="relative h-12 w-12 animate-spin text-[#FD6708]" strokeWidth={2.5} />
        </div>
        
        {/* Text with subtle pulse */}
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Loading...
          </h3>
          <p className="text-sm text-gray-500 animate-pulse">
            Fetching the latest data for you
          </p>
        </div>

      </div>
    </div>
  );
}
