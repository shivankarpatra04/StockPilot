"use client";

import { useState, useEffect } from "react";
import AIVerdictCard from "./AIVerdictCard";
import { Loader2, Target, ChevronDown } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useAppStore } from "@/store/useAppStore";


export default function FeaturedAIVerdict() {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchlistStocks, setWatchlistStocks] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE:NSE");

  // Fetch watchlist stocks on mount
  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const wl = await res.json();
          const stocks = wl[0]?.stocks.map((s: any) => s.symbol.toUpperCase()) || [];
          setWatchlistStocks(stocks);
          if (stocks.length > 0) {
            setSelectedSymbol(stocks[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch watchlist stocks for featured analysis", err);
      }
    }
    fetchWatchlist();
  }, []);

  // Fetch analysis when selectedSymbol, analysisDays, or isSimpleMode changes
  useEffect(() => {
    async function fetchFeaturedAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/claude/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            symbol: selectedSymbol, 
            days: analysisDays, 
            mode: isSimpleMode ? "simple" : "expert" 
          }),
        });
        
        if (!res.ok) throw new Error("Failed to fetch featured analysis");
        const result = await res.json();
        setData({ ...result, symbol: selectedSymbol });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedAnalysis();
  }, [selectedSymbol, analysisDays, isSimpleMode]);

  const options = watchlistStocks.length > 0 
    ? watchlistStocks 
    : ["RELIANCE:NSE", "TCS:NSE", "INFY:NSE", "HDFCBANK:NSE", "ICICIBANK:NSE"];

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Featured Analysis</h2>
        </div>
        
        {/* Premium Select Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm font-semibold text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-all shadow-sm pr-10"
          >
            {options.map((opt) => (
              <option key={opt} value={opt} className="bg-surface text-text-primary font-semibold">
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>



      {loading ? (
        <Card className="border border-border bg-surface/50">
          <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-text-muted">Generating trade verdict for {selectedSymbol}...</p>
          </CardContent>
        </Card>
      ) : error || !data?.verdict ? (
        <Card className="border border-border bg-surface/50">
          <CardContent className="p-8 text-center text-sm text-destructive">
            Failed to generate verdict: {error || "No data returned"}
          </CardContent>
        </Card>
      ) : (
        <AIVerdictCard 
          verdict={data.verdict} 
          action={data.action} 
        />
      )}
    </section>
  );
}
