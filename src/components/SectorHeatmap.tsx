"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart3, X, LineChart } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import Link from "next/link";
import DashboardSectionHeader from "@/components/DashboardSectionHeader";

interface SectorStock {
  symbol: string;
  shortName: string;
  change: number;
  price: number;
  score: number;
}

interface SectorData {
  sector: string;
  stockCount: number;
  avgChange: number;
  avgBuyScore: number;
  gainers: number;
  losers: number;
  sentiment: "bullish" | "bearish" | "neutral";
  topStock: string;
  topScore: number;
  upStocks: SectorStock[];
  downStocks: SectorStock[];
}

const SECTOR_COLORS: Record<string, string> = {
  "Banking": "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "Finance": "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
  "IT": "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  "Energy": "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  "Power": "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  "Pharma": "from-green-500/20 to-green-600/10 border-green-500/30",
  "FMCG": "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  "Auto": "from-red-500/20 to-red-600/10 border-red-500/30",
  "Infrastructure": "from-stone-500/20 to-stone-600/10 border-stone-500/30",
  "Metals": "from-zinc-500/20 to-zinc-600/10 border-zinc-500/30",
  "Cement": "from-gray-500/20 to-gray-600/10 border-gray-500/30",
  "Telecom": "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  "Chemicals": "from-teal-500/20 to-teal-600/10 border-teal-500/30",
  "Consumer": "from-rose-500/20 to-rose-600/10 border-rose-500/30",
  "Retail": "from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/30",
  "Railway": "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  "Real Estate": "from-lime-500/20 to-lime-600/10 border-lime-500/30",
  "Agri": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  "Media": "from-violet-500/20 to-violet-600/10 border-violet-500/30",
  "Aviation": "from-sky-500/20 to-sky-600/10 border-sky-500/30",
};

export default function SectorHeatmap() {
  const { analysisDays } = useAppStore();
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeatmap() {
      setLoading(true);
      setError(null);
      setSelectedSector(null); // Reset selected sector on timeframe switch
      try {
        const res = await fetch(`/api/sector-heatmap?days=${analysisDays}`);
        if (!res.ok) throw new Error("Failed to load sector data");
        const json = await res.json();
        if (json.heatmap?.length > 0) setData(json.heatmap);
        else setError("No sector data yet. Run the background scanner.");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHeatmap();
  }, [analysisDays]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedSector) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedSector]);

  if (loading) {
    return (
      <section className="space-y-5">
        <DashboardSectionHeader
          number="04"
          title="Sector Performance & Heatmap"
          subtitle="Loading sector-level trend vectors..."
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface/50 border border-border animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error || data.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">Sector Performance & Heatmap</h2>
        <Card className="border border-border bg-surface">
          <CardContent className="p-8 text-center text-text-muted">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Sector data not available yet.</p>
            <p className="text-xs mt-1 opacity-70">Run the background scanner to populate data.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <DashboardSectionHeader
        number="04"
        title="Sector Performance & Heatmap"
        subtitle={`Based on ${analysisDays}D performance across ${data.reduce((s, d) => s + d.stockCount, 0)} sector assets. Click any sector to drill down.`}
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        action={
          <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-400" /> Bullish</span>
            <span className="flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-yellow-400" /> Neutral</span>
            <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-400" /> Bearish</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {data.map((sector) => {
          const colorClass = SECTOR_COLORS[sector.sector] || "from-primary/20 to-primary/10 border-primary/30";
          const isPositive = sector.avgChange >= 0.2;
          const isNegative = sector.avgChange <= -0.2;
          const isSelected = selectedSector === sector.sector;
          const sentimentIcon = sector.sentiment === "bullish"
            ? <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            : sector.sentiment === "bearish"
              ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              : <Minus className="w-3.5 h-3.5 text-yellow-400" />;

          return (
            <div
              key={sector.sector}
              onClick={() => setSelectedSector(isSelected ? null : sector.sector)}
              className={`relative rounded-xl border bg-gradient-to-br p-3.5 hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${colorClass} ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/15 scale-[1.02] shadow-glow"
                  : "hover:border-white/20"
              }`}
            >
              {/* Score bar at top */}
              <div className="absolute top-0 left-0 h-1 rounded-t-xl bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ width: `${sector.avgBuyScore}%` }} />

              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-black text-text-primary leading-tight">{sector.sector}</span>
                {sentimentIcon}
              </div>

              <div className={`text-xl font-extrabold mb-1 ${isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-text-primary"}`}>
                {sector.avgChange >= 0 ? "+" : ""}{sector.avgChange.toFixed(2)}%
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <span>{sector.stockCount} stocks</span>
                <span className="font-bold text-primary">{sector.avgBuyScore} score</span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-[9px]">
                <span className="text-green-400 font-bold">▲{sector.gainers}</span>
                <span className="text-text-muted/50">|</span>
                <span className="text-red-400 font-bold">▼{sector.losers}</span>
              </div>

              {sector.topStock && (
                <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] text-text-muted truncate">
                  Top: <span className="text-primary font-bold">{sector.topStock.split(":")[0]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center Modal Dialog Overlay for Sector Breakdown */}
      {selectedSector && (() => {
        const sectorData = data.find((s) => s.sector === selectedSector);
        if (!sectorData) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedSector(null)} />

            {/* Modal Content Box */}
            <div className="relative w-full max-w-4xl bg-surface border border-border/80 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 z-10">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedSector(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                title="Close Overview"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-4 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-extrabold">Sector Snapshot</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">
                    {analysisDays}D Performance Timeframe
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text-primary flex items-baseline gap-2">
                  {sectorData.sector} Sector Overview
                  <span className={`text-base font-extrabold ${
                    sectorData.avgChange >= 0.2 ? "text-green-400" : sectorData.avgChange <= -0.2 ? "text-red-400" : "text-text-primary"
                  }`}>
                    {sectorData.avgChange >= 0 ? "+" : ""}{sectorData.avgChange.toFixed(2)}%
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Aggregating {sectorData.stockCount} tracked assets &bull; <span className="text-green-400 font-medium">{sectorData.gainers} gainers</span> &bull; <span className="text-red-400 font-medium">{sectorData.losers} losers</span>
                </p>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden flex-1 py-2">
                
                {/* Gainers Column (Up) */}
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Up Stocks ({sectorData.upStocks?.length || 0})
                    </span>
                  </div>

                  {sectorData.upStocks && sectorData.upStocks.length > 0 ? (
                    <div className="space-y-1.5 overflow-y-auto pr-1.5 flex-1 scrollbar-thin max-h-[48vh]">
                      {sectorData.upStocks.map((stock) => (
                        <Link
                          href={`/dashboard/analysis?symbol=${stock.symbol}`}
                          key={stock.symbol}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group/stock cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-text-primary uppercase truncate leading-none">
                                {stock.symbol.split(".")[0].split(":")[0]}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded font-semibold">
                                {stock.score} score
                              </span>
                            </div>
                            <p className="text-[9px] text-text-muted truncate mt-0.5">
                              {stock.shortName || "Unknown Stock"}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0 flex items-center gap-3">
                            <span className="text-xs text-text-muted font-medium">
                              ₹{stock.price ? stock.price.toFixed(2) : "0.00"}
                            </span>
                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded min-w-[60px] text-center group-hover/stock:hidden">
                              {formatPercent(stock.change)}
                            </span>
                            <span className="text-[9px] px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold hidden group-hover/stock:flex items-center gap-1 shadow-md animate-in fade-in duration-200">
                              <LineChart className="w-3 h-3" /> Analyse
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1 bg-surface/30 border border-dashed border-border rounded-xl p-4">
                      <p className="text-xs text-text-muted/50 italic">No rising stocks in this sector</p>
                    </div>
                  )}
                </div>

                {/* Losers Column (Down) */}
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" /> Down Stocks ({sectorData.downStocks?.length || 0})
                    </span>
                  </div>

                  {sectorData.downStocks && sectorData.downStocks.length > 0 ? (
                    <div className="space-y-1.5 overflow-y-auto pr-1.5 flex-1 scrollbar-thin max-h-[48vh]">
                      {sectorData.downStocks.map((stock) => (
                        <Link
                          href={`/dashboard/analysis?symbol=${stock.symbol}`}
                          key={stock.symbol}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group/stock cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-text-primary uppercase truncate leading-none">
                                {stock.symbol.split(".")[0].split(":")[0]}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded font-semibold">
                                {stock.score} score
                              </span>
                            </div>
                            <p className="text-[9px] text-text-muted truncate mt-0.5">
                              {stock.shortName || "Unknown Stock"}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0 flex items-center gap-3">
                            <span className="text-xs text-text-muted font-medium">
                              ₹{stock.price ? stock.price.toFixed(2) : "0.00"}
                            </span>
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded min-w-[60px] text-center group-hover/stock:hidden">
                              {formatPercent(stock.change)}
                            </span>
                            <span className="text-[9px] px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold hidden group-hover/stock:flex items-center gap-1 shadow-md animate-in fade-in duration-200">
                              <LineChart className="w-3 h-3" /> Analyse
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1 bg-surface/30 border border-dashed border-border rounded-xl p-4">
                      <p className="text-xs text-text-muted/50 italic">No falling stocks in this sector</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </section>
  );
}
