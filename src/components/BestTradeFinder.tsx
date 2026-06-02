"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  TrendingUp,
  ShieldCheck,
  Target,
  AlertTriangle,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  LineChart,
  ArrowRight,
  Plus,
  Check,
  Clock
} from "lucide-react";
import { formatScanAge } from "@/lib/format-scan-age";
import Link from "next/link";

type CategoryId = "swing" | "earnings" | "catchup" | "breakouts";

interface CategoryTag {
  id: CategoryId;
  label: string;
  reason: string;
  days: number;
}

interface BestTrade {
  symbol: string;
  currentPrice: number;
  change: number;
  score: number;
  reasoning: string;
  support: number;
  resistance: number;
  stopLoss: number;
  target: number;
  categories?: CategoryTag[];
  primaryCategory?: CategoryId | null;
}

const CATEGORY_STYLES: Record<CategoryId, { bg: string; text: string; border: string }> = {
  swing:     { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  earnings:  { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30" },
  catchup:   { bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/30" },
  breakouts: { bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/30" },
};

interface ComparedStock {
  symbol: string;
  currentPrice: number;
  change: number;
  score: number;
}

export default function BestTradeFinder() {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ bestTrade: BestTrade; allCompared: ComparedStock[]; dataAsOf?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllCompared, setShowAllCompared] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Check if stock is in watchlist when data loads
  useEffect(() => {
    if (!data?.bestTrade) return;
    const targetSymbol = data.bestTrade.symbol;
    async function checkWatchlist() {
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const wl = await res.json();
          const stocks = wl.flatMap((w: any) => w.stocks.map((s: any) => s.symbol.toUpperCase())) || [];
          setIsInWatchlist(stocks.includes(targetSymbol.toUpperCase()));
        }
      } catch (err) {
        console.error("Failed to fetch watchlist stocks in BestTradeFinder:", err);
      }
    }
    checkWatchlist();
  }, [data]);

  const handleAddToWatchlist = async () => {
    if (isInWatchlist || !data?.bestTrade) return;
    setWatchlistLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: data.bestTrade.symbol }),
      });
      if (res.ok) {
        setIsInWatchlist(true);
        setToast(`${data.bestTrade.symbol.split(":")[0]} added to watchlist!`);
        setTimeout(() => setToast(null), 3000);
      } else {
        const errData = await res.json();
        setToast(errData.error || "Failed to add stock");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error("Watchlist addition error:", err);
      setToast("Error adding to watchlist");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setWatchlistLoading(false);
    }
  };

  useEffect(() => {
    async function fetchBestTrade() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/best-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: analysisDays, mode: isSimpleMode ? "simple" : "expert" })
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch best trade recommendation");
        }
        
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load recommendation");
      } finally {
        setLoading(false);
      }
    }

    fetchBestTrade();
  }, [analysisDays, isSimpleMode]);

  if (loading) {
    return (
      <Card className="border border-primary/20 bg-surface/50 overflow-hidden relative shadow-lg shadow-primary/5 animate-pulse">
        <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-primary">Scanning Nifty 500 via Yahoo Finance...</p>
          <p className="text-xs text-text-muted">Comparing stock structures over the last {analysisDays} days</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.bestTrade) {
    return null;
  }

  const { bestTrade, allCompared } = data;
  
  // Decide badge colors
  let ratingLabel = "";
  let ratingColor = "";
  let ringColor = "";
  let ringBg = "";
  if (bestTrade.score >= 75) {
    ratingLabel = isSimpleMode ? "Pakka Buy 🟢" : "Strong Buy";
    ratingColor = "bg-success/20 text-success border-success/30";
    ringColor = "stroke-success";
    ringBg = "stroke-success/10";
  } else if (bestTrade.score >= 60) {
    ratingLabel = isSimpleMode ? "Theek Buy 🟡" : "Moderate Buy";
    ratingColor = "bg-primary/20 text-primary border-primary/30";
    ringColor = "stroke-primary";
    ringBg = "stroke-primary/10";
  } else if (bestTrade.score >= 45) {
    ratingLabel = isSimpleMode ? "Abhi ruko 🤔" : "Neutral";
    ratingColor = "bg-warning/20 text-warning border-warning/30";
    ringColor = "stroke-warning";
    ringBg = "stroke-warning/10";
  } else {
    ratingLabel = isSimpleMode ? "Door raho 🔴" : "Avoid";
    ratingColor = "bg-danger/20 text-danger border-danger/30";
    ringColor = "stroke-danger";
    ringBg = "stroke-danger/10";
  }

  // Radial progress calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (bestTrade.score / 100) * circumference;

  return (
    <Card className="border-primary/40 bg-gradient-to-r from-primary/5 via-surface to-primary/5 shadow-xl shadow-primary/5 overflow-hidden relative animate-slide-up">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
          <div className="bg-primary text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 border border-primary/20">
            <Zap className="w-4 h-4 text-warning" /> {toast}
          </div>
        </div>
      )}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Header Indicators */}
        <div className="flex items-center justify-between mb-6 border-b border-border/30 pb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-[10px] tracking-wide animate-pulse">
              LIVE SIGNAL
            </Badge>
            <span
              className="inline-flex items-center gap-1 text-[10px] text-text-muted font-bold"
              title="The cron scanner produced this snapshot. Opportunities page uses the same snapshot."
            >
              <Clock className="w-3 h-3" />
              Data as of {formatScanAge(data.dataAsOf)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-semibold hidden sm:inline">{isSimpleMode ? "Salah:" : "Signal Strength:"}</span>
            <Badge variant="outline" className={`font-bold text-xs px-2.5 py-0.5 uppercase tracking-wide ${ratingColor}`}>
              {ratingLabel}
            </Badge>
          </div>
        </div>

        {/* Grid Main Info */}
        <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Circular Score Match (Col-3) */}
          <div className="md:col-span-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/50 pb-6 md:pb-0 md:pr-8">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={ringBg}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={`${ringColor} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-text-primary">{bestTrade.score}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{isSimpleMode ? "Score 📊" : "Buy Score"}</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-2xl font-black text-text-primary tracking-tight">{bestTrade.symbol}</span>
              <p className={`text-xs font-semibold ${bestTrade.change >= 0 ? "text-success" : "text-danger"} mt-0.5`}>
                {bestTrade.change >= 0 ? "▲" : "▼"} {Math.abs(bestTrade.change).toFixed(2)}% over {analysisDays}D
              </p>
            </div>
          </div>

          {/* Simple Explanation (Col-9) */}
          <div className="md:col-span-9 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                {isSimpleMode ? "Ye sabse acchi pick kyun? 🤔" : "Why this is the best pick"}
              </h4>
              <p className="text-text-primary/95 text-base md:text-lg leading-relaxed font-semibold bg-background/50 border border-border/50 rounded-2xl p-5 md:p-6 shadow-inner italic">
                &quot;{bestTrade.reasoning}&quot;
              </p>

              {bestTrade.categories && bestTrade.categories.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {isSimpleMode ? "Ye yahan bhi dikhta hai 👇" : "Also appears in Opportunities →"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {bestTrade.categories.map((cat) => {
                      const style = CATEGORY_STYLES[cat.id];
                      const sameTimeframe = cat.days === analysisDays;
                      return (
                        <Link
                          key={`${cat.id}-${cat.days}`}
                          href={`/dashboard/opportunities?tab=${cat.id}&days=${cat.days}&highlight=${encodeURIComponent(bestTrade.symbol)}`}
                          title={`${cat.reason} (qualifies on the ${cat.days}-day timeframe)`}
                          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 ${style.bg} ${style.text} ${style.border}`}
                        >
                          {cat.label}
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              sameTimeframe
                                ? "bg-white/10"
                                : "bg-black/30 ring-1 ring-white/10"
                            }`}
                            title={sameTimeframe ? "Matches your current timeframe" : "Click to switch timeframe"}
                          >
                            {cat.days}D
                          </span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Trading Levels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3 sm:p-3.5 bg-background/40 border border-border/40 rounded-xl">
                <span className="text-[10px] sm:text-xs text-text-muted block font-semibold mb-1">{isSimpleMode ? "Khareedo (entry) 💰" : "Buy Entry Price"}</span>
                <span className="text-base sm:text-lg font-extrabold text-text-primary">₹{bestTrade.currentPrice.toFixed(2)}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-background/40 border border-border/40 rounded-xl">
                <span className="text-[10px] sm:text-xs text-text-muted block font-semibold mb-1">{isSimpleMode ? "Target (profit) 🎯" : "Target Price"}</span>
                <span className="text-base sm:text-lg font-extrabold text-success">₹{bestTrade.target.toFixed(2)}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-background/40 border border-border/40 rounded-xl">
                <span className="text-[10px] sm:text-xs text-text-muted block font-semibold mb-1">{isSimpleMode ? "Stop Loss (safety) 🛑" : "Stop Loss"}</span>
                <span className="text-base sm:text-lg font-extrabold text-danger">₹{bestTrade.stopLoss.toFixed(2)}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-background/40 border border-border/40 rounded-xl">
                <span className="text-[10px] sm:text-xs text-text-muted block font-semibold mb-1">{isSimpleMode ? "Risk vs Faayda ⚖️" : "Risk / Reward"}</span>
                <span className="text-base sm:text-lg font-extrabold text-primary">1 : 2.2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Collapsible Comparison */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {isInWatchlist ? (
            <Button
              disabled
              className="bg-secondary/20 text-secondary border border-secondary/30 font-bold px-6 cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Check className="w-4 h-4" /> {isSimpleMode ? "Watchlist me add ho gaya ✅" : "Added to Watchlist"}
            </Button>
          ) : watchlistLoading ? (
            <Button
              disabled
              className="bg-primary/50 text-primary-foreground font-bold px-6 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> {isSimpleMode ? "Add ho raha hai..." : "Adding..."}
            </Button>
          ) : (
            <Button
              onClick={handleAddToWatchlist}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-glow flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> {isSimpleMode ? "Watchlist me daalo ➕" : "Add to Watchlist"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllCompared(!showAllCompared)}
            className="text-text-muted hover:text-text-primary font-bold w-full sm:w-auto"
          >
            {showAllCompared ? (isSimpleMode ? "Chhupao" : "Hide comparisons") : (isSimpleMode ? `Saare ${allCompared.length} stocks compare karo` : `Compare all ${allCompared.length} stocks`)}
            {showAllCompared ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>

        {/* Compared List (Collapsible Table) */}
        {showAllCompared && (
          <div className="mt-6 pt-5 border-t border-dashed border-border/50 animate-fade-in">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <LineChart className="w-4 h-4 text-text-muted" />
              Nifty 500 Multi-Stock Evaluation (Ranked)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/80 text-xs font-bold text-text-muted border-b border-border/40">
                    <th className="p-3.5 pl-5">Stock</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">{analysisDays}D Performance</th>
                    <th className="p-3.5">Buy Signal Score</th>
                    <th className="p-3.5 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 bg-background/20">
                  {allCompared.map((stock, idx) => {
                    let scoreBadge = "";
                    if (stock.score >= 75) scoreBadge = "text-success font-black";
                    else if (stock.score >= 60) scoreBadge = "text-primary font-bold";
                    else if (stock.score >= 45) scoreBadge = "text-warning font-semibold";
                    else scoreBadge = "text-danger font-medium";

                    return (
                      <tr key={stock.symbol} className="hover:bg-background/50 transition-colors text-sm font-semibold">
                        <td className="p-3.5 pl-5 flex items-center gap-2">
                          <span className="text-xs text-text-muted">#{idx + 1}</span>
                          <span className="text-text-primary font-bold">{stock.symbol}</span>
                          {idx === 0 && <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase font-black px-1.5">Best</Badge>}
                        </td>
                        <td className="p-3.5 text-text-primary/95">₹{stock.currentPrice.toFixed(2)}</td>
                        <td className={`p-3.5 ${stock.change >= 0 ? "text-success" : "text-danger"}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={scoreBadge}>{stock.score}%</span>
                            <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden border border-border/20">
                              <div 
                                className={`h-full rounded-full ${
                                  stock.score >= 75 ? "bg-success" : stock.score >= 60 ? "bg-primary" : stock.score >= 45 ? "bg-warning" : "bg-danger"
                                }`} 
                                style={{ width: `${stock.score}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <Link href={`/dashboard/opportunities?symbol=${stock.symbol}`}>
                            <span className="text-xs text-primary hover:underline cursor-pointer">Analyze →</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
