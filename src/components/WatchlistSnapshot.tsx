"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AIScoreBadge from "@/components/AIScoreBadge";
import { formatCurrency, formatPercent, getChangeColor } from "@/lib/utils";
import { computeAIScore } from "@/lib/ai-score";
import type { StockQuote } from "@/types";
import { useAppStore } from "@/store/useAppStore";

export default function WatchlistSnapshot() {
  const { analysisDays } = useAppStore();
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function loadSnapshot() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const data = await res.json();
          // Take first 5 stocks from first watchlist
          const watchlistStocks = data[0]?.stocks.slice(0, 5) || [];
          
          // Fetch quotes for these stocks
          const quotes = await Promise.all(watchlistStocks.map(async (s: any) => {
            const quoteRes = await fetch(`/api/stock/quote?symbol=${s.symbol}`);
            if (quoteRes.ok) return quoteRes.json();
            return null;
          }));

          setStocks(quotes.filter(q => q !== null).map((q, i) => ({
            ...q,
            verdict: watchlistStocks[i].verdict,
            confidence: watchlistStocks[i].confidence
          })));
        }
      } catch (err) {
        console.error("Failed to load snapshot:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSnapshot();
  }, [isMounted, analysisDays]);

  if (!isMounted || isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface/50 border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Zap className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">
            Your watchlist is empty.{" "}
            <Link
              href="/dashboard/compare"
              className="text-primary hover:underline"
            >
              Search and add stocks
            </Link>{" "}
            to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {stocks.map((quote) => {
        const score = computeAIScore(quote);
        const changeColor = getChangeColor(quote.regularMarketChangePercent);
        const isPositive = quote.regularMarketChangePercent >= 0;
        
        return (
          <Link
            href={`/dashboard/analysis?symbol=${encodeURIComponent(quote.symbol)}`}
            key={quote.symbol}
            className="block"
          >
            <div className="rounded-xl border border-border bg-surface/50 p-4 hover:scale-[1.01] hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group h-full flex flex-col justify-between">
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary uppercase">
                      {quote.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary text-sm uppercase leading-none">
                        {quote.symbol.split(".")[0].split(":")[0]}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 truncate max-w-[100px]">
                        {quote.shortName}
                      </div>
                    </div>
                  </div>
                  
                  <AIScoreBadge
                    score={score.score}
                    label={score.label}
                    size="sm"
                    showLabel={false}
                  />
                </div>

                {/* Price Row */}
                <div className="my-3">
                  <div className="text-lg font-extrabold text-text-primary">
                    {formatCurrency(quote.regularMarketPrice, quote.currency)}
                  </div>
                  <div className={`text-xs font-bold flex items-center gap-1 ${changeColor}`}>
                    {isPositive ? "▲" : "▼"} {formatPercent(quote.regularMarketChangePercent)}
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  <div className="text-center p-1 bg-background/40 rounded-lg">
                    <div className="text-[8px] text-text-muted font-bold">52W HIGH</div>
                    <div className="text-[10px] font-black text-text-primary">
                      ₹{quote.fiftyTwoWeekHigh ? quote.fiftyTwoWeekHigh.toFixed(0) : "N/A"}
                    </div>
                  </div>
                  <div className="text-center p-1 bg-background/40 rounded-lg">
                    <div className="text-[8px] text-text-muted font-bold">52W LOW</div>
                    <div className="text-[10px] font-black text-text-primary">
                      ₹{quote.fiftyTwoWeekLow ? quote.fiftyTwoWeekLow.toFixed(0) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] font-bold text-primary group-hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-1 mt-auto"
              >
                Analyse <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
