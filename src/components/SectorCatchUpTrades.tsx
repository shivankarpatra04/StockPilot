"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Layers,
  TrendingUp,
  TrendingDown,
  Brain,
  ChevronRight,
  AlertCircle,
  Loader2,
  Zap,
  Info,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ALL_SECTOR_TRADES = [
  { sector: "Banking", sectorPerformance: "+2.4%", stockSymbol: "AXISBANK:NSE", stockName: "Axis Bank Ltd.", stockPerformance: "-0.3%", sectorPerformanceValue: 2.4, stockPerformanceValue: -0.3, reasoning: "Profit booking complete. Volume picking up. Likely to close the gap in 2–4 sessions.", probability: "HIGH", color: "secondary", minDays: 1 },
  { sector: "IT Services", sectorPerformance: "+1.8%", stockSymbol: "HCLTECH:NSE", stockName: "HCL Technologies", stockPerformance: "+0.2%", sectorPerformanceValue: 1.8, stockPerformanceValue: 0.2, reasoning: "Lateral movement near 20DMA. RSI oversold compared to peers. Ready for breakout.", probability: "MEDIUM", color: "amber", minDays: 7 },
  { sector: "Pharmaceuticals", sectorPerformance: "+3.1%", stockSymbol: "CIPLA:NSE", stockName: "Cipla Ltd.", stockPerformance: "+0.5%", sectorPerformanceValue: 3.1, stockPerformanceValue: 0.5, reasoning: "Inventory clearance news priced in. Smart money accumulation visible in block deals.", probability: "HIGH", color: "secondary", minDays: 7 },
  { sector: "Automobile", sectorPerformance: "+4.2%", stockSymbol: "HEROMOTOCO:NSE", stockName: "Hero MotoCorp", stockPerformance: "+1.1%", sectorPerformanceValue: 4.2, stockPerformanceValue: 1.1, reasoning: "Resistance at psychological 5000 mark. Awaiting volume spike to follow sector trend.", probability: "MEDIUM", color: "amber", minDays: 15 },
  { sector: "FMCG", sectorPerformance: "+2.9%", stockSymbol: "DABUR:NSE", stockName: "Dabur India Ltd.", stockPerformance: "+0.8%", sectorPerformanceValue: 2.9, stockPerformanceValue: 0.8, reasoning: "Rural recovery play. Sector outperforming but Dabur lagging on volume concerns. Gap close likely over next 2–3 weeks.", probability: "HIGH", color: "secondary", minDays: 15 },
  { sector: "Energy", sectorPerformance: "+5.1%", stockSymbol: "ONGC:NSE", stockName: "ONGC Ltd.", stockPerformance: "+1.8%", sectorPerformanceValue: 5.1, stockPerformanceValue: 1.8, reasoning: "Oil price recovery beneficiary lagging sector. Dividend yield provides downside cushion.", probability: "MEDIUM", color: "amber", minDays: 30 },
  { sector: "Metals", sectorPerformance: "+6.3%", stockSymbol: "HINDALCO:NSE", stockName: "Hindalco Industries", stockPerformance: "+2.2%", sectorPerformanceValue: 6.3, stockPerformanceValue: 2.2, reasoning: "Novalis contribution not yet priced in. Metal cycle peak phase. Catch-up trade to sector mean.", probability: "HIGH", color: "secondary", minDays: 30 },
  { sector: "Real Estate", sectorPerformance: "+7.4%", stockSymbol: "PRESTIGE:NSE", stockName: "Prestige Estates", stockPerformance: "+3.1%", sectorPerformanceValue: 7.4, stockPerformanceValue: 3.1, reasoning: "Housing demand surge not reflected in stock price. Strong pre-sales data expected in Q3.", probability: "HIGH", color: "secondary", minDays: 60 },
  { sector: "Infrastructure", sectorPerformance: "+8.0%", stockSymbol: "IRB:NSE", stockName: "IRB Infrastructure", stockPerformance: "+2.5%", sectorPerformanceValue: 8.0, stockPerformanceValue: 2.5, reasoning: "Government capex pipeline strong. Order book visibility high. Significant performance gap to close.", probability: "HIGH", color: "secondary", minDays: 60 },
  { sector: "Consumer Durables", sectorPerformance: "+9.2%", stockSymbol: "BLUESTAR:NSE", stockName: "Blue Star Ltd.", stockPerformance: "+4.1%", sectorPerformanceValue: 9.2, stockPerformanceValue: 4.1, reasoning: "Summer season demand surge underway. AC penetration story intact. Long-term catch-up in progress.", probability: "MEDIUM", color: "amber", minDays: 90 },
];

const RANGE_PERF_LABEL: Record<number, string> = {
  1: "today", 7: "this week", 15: "last 2 weeks",
  30: "this month", 60: "last 2 months", 90: "this quarter",
};

const PROB_FILTERS = ["All", "HIGH", "MEDIUM"];

interface Props {
  analysisDays: number;
  isSimpleMode?: boolean;
  dynamicData?: any[];
  activeCatchups?: any[];
  loading?: boolean;
  highlightSymbol?: string | null;
}

export default function SectorCatchUpTrades({ analysisDays, isSimpleMode, dynamicData, activeCatchups, loading, highlightSymbol }: Props) {
  const [showActiveLedger, setShowActiveLedger] = useState(false);
  const [probFilter, setProbFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(highlightSymbol ?? null);

  useEffect(() => { setExpandedRow(highlightSymbol ?? null); }, [highlightSymbol]);

  const perfLabel = RANGE_PERF_LABEL[analysisDays] ?? `last ${analysisDays}d`;

  const filteredTrades = useMemo(() => {
    // Always include the highlighted symbol so the Best Trade "Sector Catch-Up"
    // deep-link never lands users on an empty result.
    const base = showActiveLedger
      ? (activeCatchups || []).slice(0, 5)
      : (dynamicData || ALL_SECTOR_TRADES).filter(
          t => t.stockSymbol === highlightSymbol || t.minDays <= analysisDays
        );
    const filtered = probFilter === "All"
      ? base
      : base.filter(t => t.stockSymbol === highlightSymbol || t.probability === probFilter);
    if (!highlightSymbol) return filtered;
    return [...filtered].sort((a, b) => {
      if (a.stockSymbol === highlightSymbol) return -1;
      if (b.stockSymbol === highlightSymbol) return 1;
      return 0;
    });
  }, [analysisDays, dynamicData, activeCatchups, showActiveLedger, probFilter, highlightSymbol]);

  if (loading) return <LoadingState label="Scanning sector laggards…" />;

  const probConfig = {
    HIGH: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    MEDIUM: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
    LOW: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
  };

  return (
    <section className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {PROB_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setProbFilter(f)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200",
                probFilter === f
                  ? f === "HIGH"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : f === "MEDIUM"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-sky-400/15 text-sky-400 border-sky-400/30"
                  : "bg-[#12121F] border-border/40 text-slate-500 hover:text-slate-300 hover:border-border"
              )}
            >
              {f === "HIGH" ? "↑ High Prob" : f === "MEDIUM" ? "≈ Medium Prob" : "All"}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowActiveLedger(!showActiveLedger)}
          variant="outline"
          className={cn(
            "text-xs font-bold gap-2 h-8 px-4 rounded-lg border transition-all shrink-0",
            showActiveLedger
              ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
              : "bg-[#12121F] border-border/40 text-slate-500 hover:text-sky-400 hover:border-sky-500/40"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveLedger && "animate-pulse text-sky-400")} />
          {showActiveLedger ? "Showing Live Signals" : "Show Live Signals"}
        </Button>
      </div>

      {!showActiveLedger && (
        <p className="text-[11px] text-slate-600">
          {filteredTrades.length} laggard{filteredTrades.length !== 1 ? "s" : ""} identified ·{" "}
          <span className="text-sky-400 font-bold">{perfLabel}</span>
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#0E0E18] border-b border-border/40">
          <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Stock</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden sm:block">Sector</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Sector Perf</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Stock Perf</div>
          <div className="col-span-3 sm:col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Probability</div>
          <div className="col-span-1" />
        </div>

        {filteredTrades.length > 0 ? (
          <div className="divide-y divide-border/30 bg-[#0A0A12]">
            {filteredTrades.map((trade) => {
              const isExpanded = expandedRow === (trade.stockSymbol || trade.sector);
              const key = trade.stockSymbol || trade.sector;
              const ticker = (trade.stockSymbol || "").split(":")[0];
              const pConf = probConfig[trade.probability as keyof typeof probConfig] || probConfig.MEDIUM;
              const gap = (trade.sectorPerformanceValue - trade.stockPerformanceValue).toFixed(1);
              const gapPct = Math.min(Math.abs(parseFloat(gap)) / 10, 1) * 100;
              const isTopPick = highlightSymbol === trade.stockSymbol;

              return (
                <div key={key} className={cn(
                  "group transition-colors duration-150",
                  isTopPick ? "bg-primary/8 ring-2 ring-primary/30 ring-inset" : isExpanded ? "bg-sky-500/4" : "hover:bg-white/2"
                )}>
                  {isTopPick && (
                    <div className="px-5 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                      <span className="text-base">⭐</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        #1 Pick — Today's Best Trade Recommendation
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : key)}
                    className="w-full grid grid-cols-12 gap-2 px-5 py-4 items-center text-left"
                  >
                    {/* Stock identity */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border bg-sky-500/10 text-sky-400 border-sky-500/20">
                        {ticker.slice(0, 3) || <Layers className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{ticker || trade.sector}</p>
                        <p className="text-[10px] text-slate-600 truncate hidden sm:block">{trade.stockName}</p>
                      </div>
                    </div>

                    {/* Sector */}
                    <div className="col-span-2 hidden sm:block">
                      <span className="text-xs font-bold text-slate-400">{trade.sector}</span>
                    </div>

                    {/* Sector performance */}
                    <div className="col-span-2 hidden md:flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">{trade.sectorPerformance}</span>
                    </div>

                    {/* Stock performance */}
                    <div className="col-span-2 hidden md:flex items-center gap-1">
                      {trade.stockPerformanceValue > 0
                        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      }
                      <span className={cn("text-sm font-bold", trade.stockPerformanceValue > 0 ? "text-emerald-400" : "text-red-400")}>
                        {trade.stockPerformance}
                      </span>
                    </div>

                    {/* Probability */}
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md border", pConf.bg, pConf.border, pConf.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pConf.dot)} />
                        {trade.probability}
                      </span>
                    </div>

                    {/* Expand */}
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:text-slate-400", isExpanded && "rotate-90 text-sky-400")} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-border/30 bg-[#0D0D1A]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* AI Reasoning */}
                        <div className="md:col-span-2 rounded-xl border border-sky-500/15 bg-sky-500/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-sky-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">AI Reasoning</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed italic">{trade.reasoning}</p>
                        </div>

                        {/* Gap stats */}
                        <div className="space-y-3">
                          <div className="rounded-xl border border-border/40 bg-[#0A0A12] p-4">
                            <div className="flex items-center gap-1.5 mb-3">
                              <BarChart2 className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Performance Gap</span>
                              <span className="ml-auto text-sm font-black text-sky-400">{gap}%</span>
                            </div>
                            {/* Stacked bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] text-slate-600">
                                <span>Sector</span>
                                <span className="text-emerald-400 font-bold">{trade.sectorPerformance}</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#0E0E18] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(trade.sectorPerformanceValue / 10 * 100, 100)}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-600">
                                <span>Stock</span>
                                <span className={cn("font-bold", trade.stockPerformanceValue >= 0 ? "text-emerald-400" : "text-red-400")}>{trade.stockPerformance}</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#0E0E18] rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", trade.stockPerformanceValue >= 0 ? "bg-emerald-400/50" : "bg-red-400")} style={{ width: `${Math.min(Math.abs(trade.stockPerformanceValue) / 10 * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>

                          <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(trade.stockSymbol)}`}>
                            <Button className="w-full h-9 text-[11px] font-bold gap-1.5 bg-sky-500 hover:bg-sky-400 text-black rounded-lg">
                              View Analysis <ArrowUpRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState label={`No catch-up trades for ${analysisDays}D range. Try a wider window.`} />
        )}
      </div>

      {/* Footer note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-600 px-1">
        <Info className="w-3.5 h-3.5 text-sky-500/60 shrink-0" />
        <span>Updated each market session. Gap closes as stock returns to sector average.</span>
      </div>
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
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
