"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Brain,
  ArrowUpRight,
  History,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  ChevronRight,
  BarChart2,
  Clock,
  Target,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ALL_EARNINGS_DATA = [
  { symbol: "INFY:NSE", name: "Infosys Ltd.", daysToEarnings: 1, record: "Beat 4 of last 5 quarters", isRecordPositive: true, expectedMove: "±4.2%", verdict: "Strong guidance expected. Technical breakout aligns with earnings date. High-probability long setup.", action: "LONG", sentiment: "Beat Likely", confidence: 88 },
  { symbol: "HDFCBANK:NSE", name: "HDFC Bank Ltd.", daysToEarnings: 4, record: "Beat 5 of last 5 quarters", isRecordPositive: true, expectedMove: "±3.5%", verdict: "NIM expansion likely to continue. Structural uptrend on weekly charts. Low risk long entry.", action: "LONG", sentiment: "Beat Likely", confidence: 91 },
  { symbol: "WIPRO:NSE", name: "Wipro Ltd.", daysToEarnings: 5, record: "Missed 3 of last 5", isRecordPositive: false, expectedMove: "±5.1%", verdict: "Weak deal pipeline and management churn. Bearish engulfing pattern on daily. Avoid or short on breakdown.", action: "SHORT", sentiment: "Miss Risk", confidence: 74 },
  { symbol: "RELIANCE:NSE", name: "Reliance Industries", daysToEarnings: 12, record: "Beat 5 of last 5 quarters", isRecordPositive: true, expectedMove: "±3.8%", verdict: "Retail & Jio growth driving earnings. Accumulation pattern visible. Strong long opportunity.", action: "LONG", sentiment: "Beat Likely", confidence: 95 },
  { symbol: "AXISBANK:NSE", name: "Axis Bank Ltd.", daysToEarnings: 18, record: "Beat 4 of last 5 quarters", isRecordPositive: true, expectedMove: "±4.0%", verdict: "Credit growth and margin improvement in focus. Key level breakout imminent.", action: "LONG", sentiment: "Beat Likely", confidence: 82 },
  { symbol: "SUNPHARMA:NSE", name: "Sun Pharmaceutical", daysToEarnings: 22, record: "Beat 3 of last 5 quarters", isRecordPositive: true, expectedMove: "±3.2%", verdict: "US business recovery underway. Specialty pipeline robust. Sector tailwind supports long bias.", action: "LONG", sentiment: "Beat Likely", confidence: 77 },
  { symbol: "BAJFINANCE:NSE", name: "Bajaj Finance Ltd.", daysToEarnings: 28, record: "Missed 2 of last 5", isRecordPositive: false, expectedMove: "±5.5%", verdict: "Credit cost pressures elevated. Valuation expensive. Risk of miss on NPA guidance.", action: "SHORT", sentiment: "Miss Risk", confidence: 71 },
  { symbol: "MARUTI:NSE", name: "Maruti Suzuki India", daysToEarnings: 35, record: "Beat 5 of last 5 quarters", isRecordPositive: true, expectedMove: "±4.5%", verdict: "Strong rural demand recovery. New model launches driving volumes. Bullish setup intact.", action: "LONG", sentiment: "Beat Likely", confidence: 86 },
  { symbol: "CIPLA:NSE", name: "Cipla Ltd.", daysToEarnings: 45, record: "Beat 4 of last 5 quarters", isRecordPositive: true, expectedMove: "±3.1%", verdict: "Chronic therapy segment growing. US generics pipeline healthy. Good risk/reward on long.", action: "LONG", sentiment: "Beat Likely", confidence: 79 },
  { symbol: "ULTRACEMCO:NSE", name: "UltraTech Cement", daysToEarnings: 55, record: "Beat 3 of last 5 quarters", isRecordPositive: true, expectedMove: "±4.8%", verdict: "Infrastructure boom continues to support volumes. Pricing power returning. Structural long.", action: "LONG", sentiment: "Beat Likely", confidence: 73 },
  { symbol: "POWERGRID:NSE", name: "Power Grid Corp", daysToEarnings: 70, record: "Beat 5 of last 5 quarters", isRecordPositive: true, expectedMove: "±2.9%", verdict: "Capex cycle beneficiary. Regulated business model with visibility. Strong dividend history.", action: "LONG", sentiment: "Beat Likely", confidence: 90 },
];

interface Props {
  analysisDays: number;
  isSimpleMode?: boolean;
  dynamicData?: any[];
  activeEarnings?: any[];
  loading?: boolean;
  highlightSymbol?: string | null;
}

const RANGE_LABEL_MAP: Record<number, string> = {
  1: "Today", 7: "This Week", 15: "Next 2 Weeks",
  30: "This Month", 60: "Next 2 Months", 90: "Next Quarter",
};

const FILTERS = ["All", "Imminent", "This Week", "Upcoming"];

export default function EarningsCatalystPlays({ analysisDays, isSimpleMode, dynamicData, activeEarnings, loading, highlightSymbol }: Props) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [showActiveLedger, setShowActiveLedger] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(highlightSymbol ?? null);

  useEffect(() => { setVisibleCount(6); setExpandedRow(highlightSymbol ?? null); }, [analysisDays, activeFilter, showActiveLedger, highlightSymbol]);

  const rangeLabel = RANGE_LABEL_MAP[analysisDays] ?? `${analysisDays}D`;

  const rangeFilteredData = useMemo(() => {
    if (showActiveLedger) return activeEarnings || [];
    const dataSource = dynamicData || ALL_EARNINGS_DATA;
    // Always include the highlighted symbol so the Best Trade "Earnings
    // Catalyst" deep-link never lands users on an empty result.
    return dataSource.filter(item =>
      item.symbol === highlightSymbol ||
      (item.daysToEarnings <= analysisDays && item.action !== "AVOID")
    );
  }, [analysisDays, dynamicData, activeEarnings, showActiveLedger, highlightSymbol]);

  const filteredData = rangeFilteredData.filter(item => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Imminent") return item.daysToEarnings >= 1 && item.daysToEarnings <= 3;
    if (activeFilter === "This Week") return item.daysToEarnings >= 4 && item.daysToEarnings <= 7;
    if (activeFilter === "Upcoming") return item.daysToEarnings >= 8;
    return true;
  });

  const orderedData = highlightSymbol
    ? [...filteredData].sort((a, b) => {
        if (a.symbol === highlightSymbol) return -1;
        if (b.symbol === highlightSymbol) return 1;
        return 0;
      })
    : filteredData;

  const displayedData = orderedData.slice(0, visibleCount);

  const urgencyLevel = (days: number) =>
    days <= 3 ? "hot" : days <= 7 ? "warm" : "cool";

  const urgencyStyles = {
    hot: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25", dot: "bg-red-400" },
    warm: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25", dot: "bg-amber-400" },
    cool: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/25", dot: "bg-sky-400" },
  };

  if (loading) return <LoadingState label="Scanning catalyst signals…" />;

  return (
    <section className="space-y-5">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all duration-200",
                activeFilter === f
                  ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                  : "bg-[#12121F] border-border/40 text-slate-500 hover:text-slate-300 hover:border-border"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Active ledger toggle */}
        <Button
          onClick={() => setShowActiveLedger(!showActiveLedger)}
          variant="outline"
          className={cn(
            "text-xs font-bold gap-2 h-8 px-4 rounded-lg border transition-all duration-300 shrink-0",
            showActiveLedger
              ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
              : "bg-[#12121F] border-border/40 text-slate-500 hover:text-amber-400 hover:border-amber-500/40"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveLedger ? "text-amber-400 animate-pulse" : "")} />
          {showActiveLedger ? "Showing Live Signals" : "Show Live Signals"}
        </Button>
      </div>

      {/* Context label */}
      {!showActiveLedger && (
        <p className="text-[11px] text-slate-600">
          {filteredData.length} earnings plays within{" "}
          <span className="text-amber-400 font-bold">{analysisDays} days</span>
          {" "}· {rangeLabel}
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-3 sm:px-5 py-3 bg-[#0E0E18] border-b border-border/40">
          <div className="col-span-7 sm:col-span-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Stock</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden sm:block">Reports In</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Exp. Move</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Record</div>
          <div className="col-span-3 sm:col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Signal</div>
          <div className="col-span-2 sm:col-span-2" />
        </div>

        {displayedData.length > 0 ? (
          <div className="divide-y divide-border/30 bg-[#0A0A12]">
            {displayedData.map((stock) => {
              const isExpanded = expandedRow === stock.symbol;
              const urg = urgencyLevel(stock.daysToEarnings);
              const styles = urgencyStyles[urg];
              const ticker = stock.symbol.split(":")[0];
              const conf = stock.confidence ?? 80;
              const isTopPick = highlightSymbol === stock.symbol;

              return (
                <div key={stock.symbol} className={cn(
                  "group transition-colors duration-150",
                  isTopPick ? "bg-primary/8 ring-2 ring-primary/30 ring-inset" : isExpanded ? "bg-amber-500/4" : "hover:bg-white/2"
                )}>
                  {isTopPick && (
                    <div className="px-3 sm:px-5 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                      <span className="text-base">⭐</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        #1 Pick — Today's Best Trade Recommendation
                      </span>
                    </div>
                  )}
                  {/* Row */}
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : stock.symbol)}
                    className="w-full grid grid-cols-12 gap-2 px-3 sm:px-5 py-4 items-center text-left"
                  >
                    {/* Stock identity */}
                    <div className="col-span-7 sm:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border",
                        stock.action === "LONG"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {ticker.slice(0, 3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">{ticker}</p>
                        <p className="text-[10px] text-slate-600 truncate">{stock.name}</p>
                      </div>
                    </div>

                    {/* Reports in */}
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border", styles.bg, styles.border, styles.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dot)} />
                        {stock.daysToEarnings}d
                      </span>
                    </div>

                    {/* Expected move */}
                    <div className="col-span-2 hidden md:block">
                      <span className="text-sm font-bold text-white">{stock.expectedMove}</span>
                    </div>

                    {/* Record */}
                    <div className="col-span-2 hidden md:flex items-center gap-1">
                      <span className={cn("text-xs font-bold", stock.isRecordPositive ? "text-emerald-400" : "text-red-400")}>
                        {stock.record.split("of")[0].trim()}
                      </span>
                      <span className="text-[10px] text-slate-600">of {stock.record.split("of")[1]?.trim()}</span>
                    </div>

                    {/* Signal */}
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
                        stock.action === "LONG" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-red-500/15 text-red-400 border border-red-500/25"
                      )}>
                        {stock.action}
                      </span>
                      <span className="hidden lg:block text-[10px] font-bold text-slate-500">{conf}%</span>
                    </div>

                    {/* Chevron */}
                    <div className="col-span-2 flex justify-end">
                      <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:text-slate-400", isExpanded && "rotate-90 text-amber-400")} />
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-5 pt-2 border-t border-border/30 bg-[#0D0D1A]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* AI Verdict */}
                        <div className="md:col-span-2 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">{isSimpleMode ? "AI ki salah 🧠" : "AI Analysis"}</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed italic">{stock.verdict}</p>
                        </div>

                        {/* Stats panel */}
                        <div className="space-y-3">
                          <div className="rounded-xl border border-border/40 bg-[#0A0A12] p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <History className="w-3 h-3 text-slate-600" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Earnings Record</span>
                            </div>
                            <p className={cn("text-sm font-bold", stock.isRecordPositive ? "text-emerald-400" : "text-red-400")}>{stock.record}</p>
                          </div>

                          <div className="rounded-xl border border-border/40 bg-[#0A0A12] p-3.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <BarChart2 className="w-3 h-3 text-slate-600" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Confidence</span>
                              </div>
                              <span className="text-xs font-black text-amber-400">{conf}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#0A0A12] rounded-full overflow-hidden border border-border/30">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                                style={{ width: `${conf}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-xs text-slate-500">Expected:</span>
                              <span className="text-sm font-bold text-white">{stock.expectedMove}</span>
                            </div>
                            <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}>
                              <Button size="sm" className="h-8 text-[11px] font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 rounded-lg">
                                Analyse <ArrowUpRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState label={`No earnings plays for ${analysisDays}D range. Try a wider window.`} />
        )}
      </div>

      {/* Pagination */}
      {filteredData.length > 6 && (
        <div className="flex justify-center gap-3 pt-1">
          {visibleCount > 6 && (
            <Button onClick={() => setVisibleCount(v => Math.max(v - 6, 6))} variant="outline"
              className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 text-slate-500 rounded-lg">
              <ChevronUp className="w-3.5 h-3.5" /> Show Less
            </Button>
          )}
          {visibleCount < filteredData.length && (
            <Button onClick={() => setVisibleCount(v => Math.min(v + 6, filteredData.length))} variant="outline"
              className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 text-slate-500 rounded-lg">
              Show More <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
      <p className="text-sm text-slate-600 font-medium">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#0A0A12]">
      <div className="w-14 h-14 rounded-2xl bg-[#0E0E18] border border-border/40 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-slate-700" />
      </div>
      <p className="text-sm text-slate-600 text-center max-w-xs">{label}</p>
    </div>
  );
}
