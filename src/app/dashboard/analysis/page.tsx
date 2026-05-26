import { Suspense } from "react";
import BuySellZones from "@/components/BuySellZones";
import { Loader2 } from "lucide-react";

export default function AnalysisPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Stock Analysis</h1>
        <p className="text-text-muted text-sm mt-1">Get precise algorithm-calculated Buy and Sell zones based on technical data.</p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <BuySellZones />
      </Suspense>
    </div>
  );
}
