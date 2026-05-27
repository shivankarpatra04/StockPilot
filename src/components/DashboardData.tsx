"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart2, ArrowUpRight, ArrowDownRight, Users, X, LineChart } from "lucide-react";
import { formatPercent, formatVolume } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import Link from "next/link";

export default function DashboardData() {
  const { analysisDays } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  useEffect(() => {
    if (!isMounted) return;
    setIsLoading(true);
    fetch(`/api/market-stats?days=${analysisDays}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isMounted, analysisDays]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface rounded-xl border border-border" />)}
      </div>
    );
  }

  if (!stats) return null;

  const sentimentColor =
    stats.sentiment === "Bullish" ? "text-green-400" :
    stats.sentiment === "Bearish" ? "text-red-400" : "text-yellow-400";

  const sentimentBg =
    stats.sentiment === "Bullish" ? "border-t-green-400" :
    stats.sentiment === "Bearish" ? "border-t-red-400" : "border-t-yellow-400";

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Sentiment */}
        <Card 
          onClick={() => setShowModal(true)} 
          className={`hover:border-primary hover:scale-[1.01] transition-all duration-200 border-t-2 ${sentimentBg} cursor-pointer relative group`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide flex items-center gap-1">
                Market Sentiment <span className="text-[8px] text-primary font-bold group-hover:underline leading-none opacity-80">(View Details)</span>
              </p>
              <Activity className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className={`text-2xl font-bold ${sentimentColor}`}>{stats.sentiment}</p>
            <p className="text-xs text-text-muted mt-1">
              {stats.gainers}↑ gainers · {stats.losers}↓ losers out of {stats.total} stocks
            </p>
          </CardContent>
        </Card>

        {/* Top Gainer */}
        {stats.topGainer ? (
          <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(stats.topGainer.symbol)}`} className="block group">
            <Card className="hover:border-green-400/50 hover:bg-green-500/5 hover:scale-[1.01] transition-all duration-200 border-t-2 border-t-green-400 cursor-pointer relative overflow-hidden h-full">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Top Gainer</p>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xl font-bold text-text-primary leading-tight">{stats.topGainer.symbol.split(":")[0]}</p>
                <p className="text-[10px] text-text-muted truncate">{stats.topGainer.shortName}</p>
                <p className="text-sm font-bold text-green-400 mt-1 flex items-center gap-1 group-hover:hidden">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{stats.topGainer.change?.toFixed(2)}% ({analysisDays}D)
                </p>
                <span className="text-[10px] px-2 py-1 mt-1.5 bg-primary text-primary-foreground rounded font-bold hidden group-hover:flex items-center gap-1 w-max shadow-md animate-in fade-in duration-200 leading-none">
                  <LineChart className="w-3 h-3" /> Analyse
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-t-2 border-t-green-400">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Top Gainer</p>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-text-muted text-sm">Unavailable</p>
            </CardContent>
          </Card>
        )}

        {/* Top Loser */}
        {stats.topLoser ? (
          <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(stats.topLoser.symbol)}`} className="block group">
            <Card className="hover:border-red-400/50 hover:bg-red-500/5 hover:scale-[1.01] transition-all duration-200 border-t-2 border-t-red-400 cursor-pointer relative overflow-hidden h-full">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Top Loser</p>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xl font-bold text-text-primary leading-tight">{stats.topLoser.symbol.split(":")[0]}</p>
                <p className="text-[10px] text-text-muted truncate">{stats.topLoser.shortName}</p>
                <p className="text-sm font-bold text-red-400 mt-1 flex items-center gap-1 group-hover:hidden">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {stats.topLoser.change?.toFixed(2)}% ({analysisDays}D)
                </p>
                <span className="text-[10px] px-2 py-1 mt-1.5 bg-primary text-primary-foreground rounded font-bold hidden group-hover:flex items-center gap-1 w-max shadow-md animate-in fade-in duration-200 leading-none">
                  <LineChart className="w-3 h-3" /> Analyse
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-t-2 border-t-red-400">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Top Loser</p>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-text-muted text-sm">Unavailable</p>
            </CardContent>
          </Card>
        )}

        {/* Most Active */}
        {stats.mostActive ? (
          <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(stats.mostActive.symbol)}`} className="block group">
            <Card className="hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] transition-all duration-200 border-t-2 border-t-primary cursor-pointer relative overflow-hidden h-full">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Most Active</p>
                  <BarChart2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-text-primary leading-tight">{stats.mostActive.symbol.split(":")[0]}</p>
                <p className="text-[10px] text-text-muted truncate">{stats.mostActive.shortName}</p>
                <p className="text-xs text-text-muted mt-1 group-hover:hidden">Vol: {formatVolume(stats.mostActive.volume)}</p>
                <span className="text-[10px] px-2 py-1 mt-1.5 bg-primary text-primary-foreground rounded font-bold hidden group-hover:flex items-center gap-1 w-max shadow-md animate-in fade-in duration-200 leading-none">
                  <LineChart className="w-3 h-3" /> Analyse
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-t-2 border-t-primary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Most Active</p>
                <BarChart2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-text-muted text-sm">Unavailable</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Center Modal Dialog Overlay for Sentiment / Market Breakdown */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-5xl bg-surface border border-border/80 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 z-10">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all tap-target flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4 sm:mb-6 pr-10">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-primary font-extrabold">Market Breakdown</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted whitespace-nowrap">
                  {analysisDays}D Timeframe
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-text-primary flex items-baseline gap-2 flex-wrap">
                Overall Market Sentiment: <span className={sentimentColor}>{stats.sentiment}</span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Displaying gainers and losers from the entire tracked pool of {stats.total} stocks.
              </p>
            </div>

            {/* Dual List Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-y-auto md:overflow-hidden flex-1 py-2 custom-scrollbar">
              
              {/* Gainers Column */}
              <div className="flex flex-col md:h-full md:overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-sm font-bold text-green-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Top Market Gainers ({stats.gainers})
                  </h4>
                </div>
                <div className="md:flex-1 md:overflow-y-auto space-y-2 pr-1 md:custom-scrollbar">
                  {stats.sectorPerf
                    ?.flatMap((s: any) => s.upStocks || [])
                    .sort((a: any, b: any) => b.change - a.change)
                    .map((stock: any) => (
                      <Link
                        key={stock.symbol}
                        href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}
                        onClick={() => setShowModal(false)}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface/50 border border-border/40 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 group/stock cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-text-primary uppercase leading-none break-all">
                              {stock.symbol.split(".")[0].split(":")[0]}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded font-semibold leading-none whitespace-nowrap">
                              {stock.score} score
                            </span>
                            {stock.sector && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-text-muted rounded font-bold uppercase leading-none whitespace-nowrap hidden sm:inline-block">
                                {stock.sector}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-text-muted truncate mt-0.5">
                            {stock.shortName || "Unknown Stock"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
                          <span className="text-[10px] sm:text-xs text-text-muted font-medium whitespace-nowrap">
                            ₹{stock.price ? stock.price.toFixed(2) : "0.00"}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded min-w-[56px] sm:min-w-[60px] text-center group-hover/stock:hidden leading-none whitespace-nowrap">
                            +{stock.change ? stock.change.toFixed(2) : "0.00"}%
                          </span>
                          <span className="text-[9px] px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold hidden group-hover/stock:flex items-center gap-1 shadow-md animate-in fade-in duration-200">
                            <LineChart className="w-3 h-3" /> Analyse
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>

              {/* Losers Column */}
              <div className="flex flex-col md:h-full md:overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" /> Top Market Losers ({stats.losers})
                  </h4>
                </div>
                <div className="md:flex-1 md:overflow-y-auto space-y-2 pr-1 md:custom-scrollbar">
                  {stats.sectorPerf
                    ?.flatMap((s: any) => s.downStocks || [])
                    .sort((a: any, b: any) => a.change - b.change)
                    .map((stock: any) => (
                      <Link
                        key={stock.symbol}
                        href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}
                        onClick={() => setShowModal(false)}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface/50 border border-border/40 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 group/stock cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-text-primary uppercase leading-none break-all">
                              {stock.symbol.split(".")[0].split(":")[0]}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded font-semibold leading-none whitespace-nowrap">
                              {stock.score} score
                            </span>
                            {stock.sector && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-text-muted rounded font-bold uppercase leading-none whitespace-nowrap hidden sm:inline-block">
                                {stock.sector}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-text-muted truncate mt-0.5">
                            {stock.shortName || "Unknown Stock"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
                          <span className="text-[10px] sm:text-xs text-text-muted font-medium whitespace-nowrap">
                            ₹{stock.price ? stock.price.toFixed(2) : "0.00"}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded min-w-[56px] sm:min-w-[60px] text-center group-hover/stock:hidden leading-none whitespace-nowrap">
                            {stock.change ? stock.change.toFixed(2) : "0.00"}%
                          </span>
                          <span className="text-[9px] px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold hidden group-hover/stock:flex items-center gap-1 shadow-md animate-in fade-in duration-200">
                            <LineChart className="w-3 h-3" /> Analyse
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
