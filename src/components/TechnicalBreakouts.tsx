"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Activity,
  Volume2,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  Brain,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreakoutPlay {
  symbol: string;
  name: string;
  price: number;
  change: number;
  resistance: number;
  breakoutType: "CLEARED" | "APPROACHING";
  percentString: string;
  volumeSurge: string;
  probability: number;
  rsi: number;
  reasoning: string;
}

interface Props {
  analysisDays: number;
  isSimpleMode?: boolean;
  dynamicData?: BreakoutPlay[];
  activeBreakouts?: BreakoutPlay[];
  loading?: boolean;
  highlightSymbol?: string | null;
}

const FILTERS = ["All", "Cleared", "Approaching"];

export default function TechnicalBreakouts({ analysisDays, isSimpleMode, dynamicData, activeBreakouts, loading, highlightSymbol }: Props) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [showActiveLedger, setShowActiveLedger] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(highlightSymbol ?? null);

  useEffect(() => { setVisibleCount(6); setExpandedRow(highlightSymbol ?? null); }, [analysisDays, showActiveLedger, activeFilter, highlightSymbol]);

  const plays = useMemo(() => {
    const dataSource = showActiveLedger ? (activeBreakouts || []) : (dynamicData || []);
    return dataSource.filter(p => p.probability >= 70);
  }, [showActiveLedger, activeBreakouts, dynamicData]);

  const filteredPlays = plays.filter(p => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Cleared") return p.breakoutType === "CLEARED";
    if (activeFilter === "Approaching") return p.breakoutType === "APPROACHING";
    return true;
  });

  const orderedPlays = highlightSymbol
    ? [...filteredPlays].sort((a, b) => {
        if (a.symbol === highlightSymbol) return -1;
        if (b.symbol === highlightSymbol) return 1;
        return 0;
      })
    : filteredPlays;

  const displayedPlays = orderedPlays.slice(0, visibleCount);

  if (loading) return <LoadingState label="Scanning resistance breakout signals…" />;

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
                  ? f === "Cleared"
                    ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                    : f === "Approaching"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-violet-400/15 text-violet-400 border-violet-400/30"
                  : "bg-[#12121F] border-border/40 text-slate-500 hover:text-slate-300 hover:border-border"
              )}
            >
              {f === "Cleared" ? "⚡ Cleared" : f === "Approaching" ? "⏩ Approaching" : "All"}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowActiveLedger(!showActiveLedger)}
          variant="outline"
          className={cn(
            "text-xs font-bold gap-2 h-8 px-4 rounded-lg border transition-all shrink-0",
            showActiveLedger
              ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
              : "bg-[#12121F] border-border/40 text-slate-500 hover:text-violet-400 hover:border-violet-500/40"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveLedger && "animate-pulse text-violet-400")} />
          {showActiveLedger ? "Showing Live Signals" : "Show Live Signals"}
        </Button>
      </div>

      {!showActiveLedger && filteredPlays.length > 0 && (
        <p className="text-[11px] text-slate-600">
          {filteredPlays.length} breakout signal{filteredPlays.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-violet-400 font-bold">probability ≥70%</span>
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-12 gap-2 px-3 sm:px-5 py-3 bg-[#0E0E18] border-b border-border/40">
          <div className="col-span-7 sm:col-span-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Stock</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden sm:block">Price</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Status</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hidden md:block">Vol. Surge</div>
          <div className="col-span-3 sm:col-span-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Probability</div>
          <div className="col-span-2 sm:col-span-1" />
        </div>

        {displayedPlays.length > 0 ? (
          <div className="divide-y divide-border/30 bg-[#0A0A12]">
            {displayedPlays.map((play) => {
              const isExpanded = expandedRow === play.symbol;
              const ticker = play.symbol.split(":")[0];
              const isCleared = play.breakoutType === "CLEARED";
              const isTopPick = highlightSymbol === play.symbol;

              return (
                <div key={play.symbol} className={cn(
                  "group transition-colors duration-150",
                  isTopPick ? "bg-primary/8 ring-2 ring-primary/30 ring-inset" : isExpanded ? "bg-violet-500/4" : "hover:bg-white/2"
                )}>
                  {isTopPick && (
                    <div className="px-3 sm:px-5 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                      <span className="text-base">⭐</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        #1 Pick — Today's Best Trade Recommendation
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : play.symbol)}
                    className="w-full grid grid-cols-12 gap-2 px-3 sm:px-5 py-4 items-center text-left"
                  >
                    {/* Stock identity */}
                    <div className="col-span-7 sm:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border bg-violet-500/10 text-violet-400 border-violet-500/20">
                        {ticker.slice(0, 3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">{ticker}</p>
                        <p className="text-[10px] text-slate-600 truncate">{play.name}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 hidden sm:block">
                      <p className="text-sm font-bold text-white">₹{play.price.toFixed(0)}</p>
                      <p className={cn("text-[10px] font-bold flex items-center gap-0.5 mt-0.5", play.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {play.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {play.change >= 0 ? "+" : ""}{play.change.toFixed(2)}%
                      </p>
                    </div>

                    {/* Breakout status */}
                    <div className="col-span-2 hidden md:flex items-center">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-md border",
                        isCleared
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {isCleared ? `✓ +${play.percentString}%` : `→ -${play.percentString}%`}
                      </span>
                    </div>

                    {/* Volume surge */}
                    <div className="col-span-2 hidden md:flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-sm font-bold text-white">{play.volumeSurge}x</span>
                      <span className="text-[10px] text-slate-600">avg</span>
                    </div>

                    {/* Probability */}
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#0E0E18] rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                          style={{ width: `${play.probability}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-violet-400">{play.probability}%</span>
                    </div>

                    {/* Expand */}
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:text-slate-400", isExpanded && "rotate-90 text-violet-400")} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-5 pt-2 border-t border-border/30 bg-[#0D0D1A]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Reasoning */}
                        <div className="md:col-span-2 rounded-xl border border-violet-500/15 bg-violet-500/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-violet-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Signal Reasoning</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed italic">{play.reasoning}</p>
                        </div>

                        {/* Quick stats */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/40 bg-[#0A0A12] p-3">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-1">RSI</p>
                              <p className={cn("text-base font-black", play.rsi > 70 ? "text-red-400" : play.rsi < 40 ? "text-emerald-400" : "text-white")}>{play.rsi}</p>
                            </div>
                            <div className="rounded-xl border border-border/40 bg-[#0A0A12] p-3">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-1">Resistance</p>
                              <p className="text-sm font-bold text-white">₹{play.resistance.toFixed(0)}</p>
                            </div>
                          </div>

                          <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(play.symbol)}`}>
                            <Button className="w-full h-9 text-[11px] font-bold gap-1.5 bg-violet-500 hover:bg-violet-400 text-white rounded-lg">
                              Full Analysis <ArrowRight className="w-3 h-3" />
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
          <EmptyState label={`No breakout signals found. Try a wider range.`} />
        )}
      </div>

      {/* Pagination */}
      {filteredPlays.length > 6 && (
        <div className="flex justify-center gap-3 pt-1">
          {visibleCount > 6 && (
            <Button onClick={() => setVisibleCount(v => Math.max(v - 6, 6))} variant="outline"
              className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30 text-slate-500 rounded-lg">
              <ChevronUp className="w-3.5 h-3.5" /> Show Less
            </Button>
          )}
          {visibleCount < filteredPlays.length && (
            <Button onClick={() => setVisibleCount(v => Math.min(v + 6, filteredPlays.length))} variant="outline"
              className="text-xs font-bold gap-1.5 px-5 h-9 border-border/40 bg-[#0E0E18] hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30 text-slate-500 rounded-lg">
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
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
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
