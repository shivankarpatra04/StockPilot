"use client";

import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

const ANALYSIS_PERIODS = [
  { label: "1D", value: 1 },
  { label: "7D", value: 7 },
  { label: "15D", value: 15 },
  { label: "30D", value: 30 },
  { label: "60D", value: 60 },
  { label: "90D", value: 90 },
];

export default function GlobalAnalysisSelector() {
  const { analysisDays, setAnalysisDays } = useAppStore();

  return (
    <div className="flex items-center gap-1 bg-surface/50 border border-border rounded-full px-1 py-1">
      <div className="hidden sm:flex items-center gap-1 px-1.5 text-text-muted">
        <Calendar className="w-3 h-3" />
      </div>
      <div className="flex items-center gap-0.5">
        {ANALYSIS_PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setAnalysisDays(period.value)}
            className={cn(
              "px-2 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap",
              analysisDays === period.value 
                ? "bg-primary text-white shadow-glow-primary scale-105" 
                : "text-text-muted hover:text-text-primary hover:bg-card"
            )}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
