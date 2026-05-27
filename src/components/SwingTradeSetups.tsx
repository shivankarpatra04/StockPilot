"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Clock,
  Target,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ALL_SWING_TRADES = [
  { symbol: "RELIANCE:NSE", name: "Reliance Industries", direction: "LONG", expiryDays: 1, entry: "₹2940 – ₹2960", stopLoss: "₹2885", target1: "₹3080", target2: "₹3150", riskReward: "1:2.2", trigger: "Break and retest of multi-month resistance confirmed with high volume.", confidence: 92 },
  { symbol: "BAJFINANCE:NSE", name: "Bajaj Finance Ltd.", direction: "SHORT", expiryDays: 5, entry: "₹7120 – ₹7150", stopLoss: "₹7280", target1: "₹6850", target2: "₹6600", riskReward: "1:3.1", trigger: "Head and shoulders pattern breakdown on daily timeframe. RSI bearish divergence.", confidence: 76 },
  { symbol: "SUNPHARMA:NSE", name: "Sun Pharmaceutical", direction: "LONG", expiryDays: 7, entry: "₹1540 – ₹1555", stopLoss: "₹1510", target1: "₹1620", target2: "₹1680", riskReward: "1:2.5", trigger: "Consolidation breakout above previous swing high. Sector tailwinds active.", confidence: 95 },
  { symbol: "HCLTECH:NSE", name: "HCL Technologies", direction: "SHORT", expiryDays: 7, entry: "₹1310 – ₹1325", stopLoss: "₹1360", target1: "₹1240", target2: "₹1180", riskReward: "1:2.8", trigger: "Bearish engulfing at resistance zone. Weak guidance from sector peers.", confidence: 71 },
  { symbol: "TATAMOTORS:NSE", name: "Tata Motors Ltd.", direction: "LONG", expiryDays: 10, entry: "₹820 – ₹835", stopLoss: "₹795", target1: "₹895", target2: "₹950", riskReward: "1:2.4", trigger: "Double bottom confirmed at demand zone. JLR recovery story intact. Volume uptick on daily.", confidence: 79 },
  { symbol: "AXISBANK:NSE", name: "Axis Bank Ltd.", direction: "LONG", expiryDays: 12, entry: "₹1085 – ₹1095", stopLoss: "₹1050", target1: "₹1165", target2: "₹1200", riskReward: "1:2.1", trigger: "Cup and handle breakout on weekly chart. Institutional accumulation visible in FII data.", confidence: 91 },
  { symbol: "WIPRO:NSE", name: "Wipro Ltd.", direction: "SHORT", expiryDays: 14, entry: "₹470 – ₹480", stopLoss: "₹505", target1: "₹430", target2: "₹410", riskReward: "1:1.9", trigger: "Lower highs formation on daily. IT sector underperformance. Weak deal wins reported.", confidence: 68 },
  { symbol: "MARUTI:NSE", name: "Maruti Suzuki India", direction: "LONG", expiryDays: 20, entry: "₹11800 – ₹11900", stopLoss: "₹11400", target1: "₹12600", target2: "₹13000", riskReward: "1:2.0", trigger: "Monthly chart breakout with strong momentum. New model launches in Q4 acting as catalyst.", confidence: 77 },
  { symbol: "HINDALCO:NSE", name: "Hindalco Industries", direction: "LONG", expiryDays: 25, entry: "₹580 – ₹595", stopLoss: "₹555", target1: "₹650", target2: "₹690", riskReward: "1:2.6", trigger: "Metal sector outperformance. Hindalco lagging but accumulation spotted. Commodity uptrend intact.", confidence: 73 },
  { symbol: "ONGC:NSE", name: "ONGC Ltd.", direction: "LONG", expiryDays: 30, entry: "₹185 – ₹190", stopLoss: "₹176", target1: "₹210", target2: "₹225", riskReward: "1:2.3", trigger: "Oil price reversal play. PSU reform narrative. Dividend support at current levels.", confidence: 65 },
  { symbol: "POWERGRID:NSE", name: "Power Grid Corp", direction: "LONG", expiryDays: 45, entry: "₹285 – ₹292", stopLoss: "₹272", target1: "₹320", target2: "₹340", riskReward: "1:2.5", trigger: "Infrastructure capex cycle play. Regulated revenue model with high visibility. Multi-month base forming.", confidence: 94 },
  { symbol: "DABUR:NSE", name: "Dabur India Ltd.", direction: "LONG", expiryDays: 60, entry: "₹535 – ₹545", stopLoss: "₹512", target1: "₹595", target2: "₹625", riskReward: "1:2.2", trigger: "Rural recovery multi-month trade. Volume base expanding. Seasonal FMCG demand picking up.", confidence: 72 },
  { symbol: "PRESTIGE:NSE", name: "Prestige Estates", direction: "LONG", expiryDays: 75, entry: "₹1520 – ₹1545", stopLoss: "₹1470", target1: "₹1680", target2: "₹1760", riskReward: "1:2.4", trigger: "Real estate supercycle play. Strong pre-sales pipeline. Consolidation complete, breakout imminent.", confidence: 78 },
  { symbol: "ULTRACEMCO:NSE", name: "UltraTech Cement", direction: "LONG", expiryDays: 90, entry: "₹11200 – ₹11350", stopLoss: "₹10800", target1: "₹12200", target2: "₹12800", riskReward: "1:2.1", trigger: "Infra mega-project beneficiary. Cement demand at decade highs. Quarterly uptrend intact.", confidence: 93 },
];

const RANGE_VALIDITY_LABEL: Record<number, string> = {
  1: "intraday", 7: "this week", 15: "next 2 weeks",
  30: "this month", 60: "next 2 months", 90: "this quarter",
};

const FILTERS = ["All", "LONG", "SHORT"];

interface Props {
  analysisDays: number;
  isSimpleMode?: boolean;
  dynamicData?: any[];
  activeSwings?: any[];
  loading?: boolean;
  highlightSymbol?: string | null;
}

export default function SwingTradeSetups({ analysisDays, isSimpleMode, dynamicData, activeSwings, loading, highlightSymbol }: Props) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [showActiveLedger, setShowActiveLedger] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(highlightSymbol ?? null);

  useEffect(() => { setVisibleCount(6); setExpandedRow(highlightSymbol ?? null); }, [analysisDays, activeFilter, showActiveLedger, highlightSymbol]);

  const validityLabel = RANGE_VALIDITY_LABEL[analysisDays] ?? `${analysisDays}d`;

  const rangeFilteredTrades = useMemo(() => {
    if (showActiveLedger) return activeSwings || [];
    const dataSource = dynamicData || ALL_SWING_TRADES;
    // Always include the highlighted symbol so the Best Trade card's "Also
    // appears in Swing Setups" link never lands the user on an empty result.
    return dataSource.filter(t =>
      t.symbol === highlightSymbol ||
      (t.expiryDays <= analysisDays && t.confidence >= 70)
    );
  }, [analysisDays, dynamicData, activeSwings, showActiveLedger, highlightSymbol]);

  const filteredTrades = rangeFilteredTrades.filter(t => {
    if (activeFilter === "All") return true;
    return t.direction === activeFilter;
  });

  // Promote highlighted symbol to the top so users find it instantly
  const orderedTrades = highlightSymbol
    ? [...filteredTrades].sort((a, b) => {
        if (a.symbol === highlightSymbol) return -1;
        if (b.symbol === highlightSymbol) return 1;
        return 0;
      })
    : filteredTrades;

  const displayedTrades = orderedTrades.slice(0, visibleCount);

  if (loading) return <LoadingState label="Scanning swing setups…" />;

  return (
    <section className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200",
                activeFilter === f
                  ? f === "LONG"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : f === "SHORT"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-emerald-400/15 text-emerald-400 border-emerald-400/30"
                  : "bg-[#12121F] border-border/40 text-slate-500 hover:text-slate-300 hover:border-border"
              )}
            >
              {f === "LONG" ? "↑ Long" : f === "SHORT" ? "↓ Short" : "All"}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowActiveLedger(!showActiveLedger)}
          variant="outline"
          className={cn(
            "text-xs font-bold gap-2 h-8 px-4 rounded-lg border transition-all shrink-0",
            showActiveLedger
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
              : "bg-[#12121F] border-border/40 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveLedger && "animate-pulse text-emerald-400")} />
          {showActiveLedger ? "Showing Live Signals" : "Show Live Signals"}
        </Button>
      </div>

      {!showActiveLedger && (
        <p className="text-[11px] text-slate-600">
          {filteredTrades.length} setups valid for{" "}
          <span className="text-emerald-400 font-bold">{validityLabel}</span>
          {" "}· confidence ≥70%
        </p>
      )}

      {/* Cards Grid */}
      {displayedTrades.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedTrades.map((trade) => {
              const isExpanded = expandedRow === trade.symbol;
              const isLong = trade.direction === "LONG";
              const ticker = trade.symbol.split(":")[0];
              const isTopPick = highlightSymbol === trade.symbol;

              return (
                <div
                  key={trade.symbol}
                  className={cn(
                    "rounded-xl border transition-all duration-300 overflow-hidden",
                    isTopPick
                      ? "border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                      : isLong ? "border-emerald-500/20" : "border-red-500/20",
                    isExpanded && !isTopPick
                      ? isLong ? "bg-emerald-500/4 shadow-lg shadow-emerald-500/5" : "bg-red-500/4 shadow-lg shadow-red-500/5"
                      : !isTopPick && "bg-[#0A0A12] hover:border-opacity-40"
                  )}
                >
                  {isTopPick && (
                    <div className="px-3 sm:px-5 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                      <span className="text-base">⭐</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        #1 Pick — Today's Best Trade Recommendation
                      </span>
                    </div>
                  )}
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : trade.symbol)}
                    className="w-full text-left"
                  >
                    <div className="px-3 sm:px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] border shrink-0",
                            isLong
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            {ticker.slice(0, 3)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-white text-base tracking-tight">{ticker}</p>
                              <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border whitespace-nowrap",
                                isLong
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              )}>
                                {isLong ? "↑ LONG" : "↓ SHORT"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate">{trade.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right hidden sm:block">
                            <span className="text-[9px] text-slate-600 uppercase tracking-wider block">R:R</span>
                            <span className="text-sm font-black text-white">{trade.riskReward}</span>
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 text-slate-600 transition-transform duration-300",
                            isExpanded && "rotate-90",
                            isLong ? "group-hover:text-emerald-400" : "group-hover:text-red-400"
                          )} />
                        </div>
                      </div>

                      {/* Price levels — compact row */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: isSimpleMode ? "Buy Zone" : "Entry", value: trade.entry, color: "text-white" },
                          { label: isSimpleMode ? "Exit If" : "Stop Loss", value: trade.stopLoss, color: "text-red-400" },
                          { label: isSimpleMode ? "Aim 1" : "Target 1", value: trade.target1, color: "text-emerald-400" },
                          { label: isSimpleMode ? "Aim 2" : "Target 2", value: trade.target2, color: "text-emerald-400" },
                        ].map(item => (
                          <div key={item.label} className="bg-[#0E0E18] rounded-lg p-2.5 border border-border/30">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className={cn("text-xs font-bold truncate", item.color)}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-[11px] text-slate-600">Valid {trade.expiryDays}d</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-[#0E0E18] rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", isLong ? "bg-emerald-400" : "bg-red-400")}
                              style={{ width: `${trade.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{trade.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-5 border-t border-border/30 pt-4 space-y-3 bg-[#0D0D1A]">
                      <div className={cn(
                        "rounded-xl border p-4",
                        isLong ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className={cn("w-3.5 h-3.5 shrink-0", isLong ? "text-emerald-400" : "text-red-400")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trade Trigger</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed italic">{trade.trigger}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-xs text-slate-600">{isSimpleMode ? "Confidence" : "AI Confidence"}:</span>
                          <span className={cn("text-sm font-black", isLong ? "text-emerald-400" : "text-red-400")}>{trade.confidence}%</span>
                        </div>
                        <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(trade.symbol)}`}>
                          <Button className={cn(
                            "h-8 text-[11px] font-bold gap-1.5 px-4 rounded-lg",
                            isLong ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-red-500 hover:bg-red-400 text-white"
                          )}>
                            Full Analysis <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTrades.length > 6 && (
            <div className="flex justify-center gap-3 pt-1">
              {visibleCount > 6 && (
                <Button onClick={() => setVisibleCount(v => Math.max(v - 6, 6))} variant="outline"
                  className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-slate-500 rounded-lg">
                  <ChevronUp className="w-3.5 h-3.5" /> Show Less
                </Button>
              )}
              {visibleCount < filteredTrades.length && (
                <Button onClick={() => setVisibleCount(v => Math.min(v + 6, filteredTrades.length))} variant="outline"
                  className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-slate-500 rounded-lg">
                  Show More <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState label={`No swing setups for ${analysisDays}D range. Try a wider window.`} />
      )}
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
      <p className="text-sm text-slate-600 font-medium">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-[#0A0A12]">
      <div className="w-14 h-14 rounded-2xl bg-[#0E0E18] border border-border/40 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-slate-700" />
      </div>
      <p className="text-sm text-slate-600 text-center max-w-xs">{label}</p>
    </div>
  );
}
