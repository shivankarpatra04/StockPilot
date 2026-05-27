// filepath: src/app/dashboard/compare/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComparisonCard from "@/components/ComparisonCard";
import ScoreBarChart from "@/components/ScoreBarChart";
import { Search, X, Sparkles, AlertCircle, Plus, Loader2 } from "lucide-react";
import type { StockQuote, AIScore } from "@/types";
import { computeAIScore } from "@/lib/ai-score";

import StockSearch from "@/components/StockSearch";


interface ComparisonResult {
  quote: StockQuote;
  aiScore: AIScore;
}

const SUGGESTED_SYMBOLS = ["RELIANCE:NSE", "TCS:NSE", "INFY:NSE", "HDFCBANK:NSE", "ICICIBANK:NSE", "SBIN:NSE", "BHARTIARTL:NSE"];

export default function ComparePage() {
  const { analysisDays } = useAppStore();
  const [enteredSymbols, setEnteredSymbols] = useState<string[]>([]);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function addSymbol(sym: string) {
    const upper = sym.trim().toUpperCase();
    if (enteredSymbols.includes(upper)) {
      setError(`${upper} is already in your list.`);
      return;
    }
    if (enteredSymbols.length >= 3) {
      setError("You can compare up to 3 stocks at a time.");
      return;
    }
    setEnteredSymbols((prev) => [...prev, upper]);
    setError(null);
  }

  function removeSymbol(sym: string) {
    setEnteredSymbols((prev) => prev.filter((s) => s !== sym));
  }

  const handleCompare = useCallback(async () => {
    if (enteredSymbols.length === 0) {
      setError("Please enter at least one stock symbol.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setAiVerdict(null);

    try {
      // Fetch all quotes in parallel
      const quoteResponses = await Promise.all(
        enteredSymbols.map(async (symbol) => {
          const res = await fetch(`/api/stock/quote?symbol=${symbol}`);
          if (!res.ok) return null;
          return res.json() as Promise<StockQuote>;
        })
      );

      const validResults: ComparisonResult[] = [];
      const failedSymbols: string[] = [];

      quoteResponses.forEach((quote, idx) => {
        if (quote) {
          const aiScore = computeAIScore(quote);
          validResults.push({ quote, aiScore });
        } else {
          failedSymbols.push(enteredSymbols[idx]);
        }
      });

      if (validResults.length === 0) {
        setError(
          "Could not fetch data for any of the entered symbols. Please check the symbols and try again."
        );
        return;
      }

      if (failedSymbols.length > 0) {
        setError(
          `Data unavailable for: ${failedSymbols.join(", ")}. Showing results for remaining stocks.`
        );
      }

      setResults(validResults);

      // Fetch System verdict if we have scores
      if (validResults.length >= 1) {
        try {
          const verdictRes = await fetch("/api/claude/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              symbols: validResults.map((r) => r.quote.symbol),
              scores: validResults.map((r) => r.aiScore.score),
              days: analysisDays
            }),
          });
          const verdictData = (await verdictRes.json()) as { text: string };
          setAiVerdict(verdictData.text);
        } catch {
          setAiVerdict(
            "System verdict temporarily unavailable. Please try again."
          );
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("[Compare] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enteredSymbols, analysisDays]);

  // Auto-compare when global range changes
  useEffect(() => {
    if (isMounted && results.length > 0 && !isLoading) {
      handleCompare();
    }
  }, [analysisDays]); // Only trigger on range change

  const chartData = results.map((r) => ({
    symbol: r.quote.symbol,
    score: r.aiScore.score,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Stock Comparison
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Compare up to 3 stocks side-by-side with Technical scores and live data
        </p>
      </div>



      {/* Search Section */}
      <Card className="overflow-visible">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <StockSearch 
                onSelect={addSymbol} 
                disabled={enteredSymbols.length >= 3} 
              />
              <Button
                onClick={handleCompare}
                disabled={isLoading || enteredSymbols.length === 0}
                className="h-11 px-8 shadow-glow"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Compare Now
                  </span>
                )}
              </Button>
            </div>

            {/* Suggested symbols */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-text-muted self-center">Try:</span>
              {SUGGESTED_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => {
                    if (!enteredSymbols.includes(sym) && enteredSymbols.length < 3) {
                      setEnteredSymbols((prev) => [...prev, sym]);
                    }
                  }}
                  disabled={enteredSymbols.includes(sym) || enteredSymbols.length >= 3}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Selected symbols pills */}
            {enteredSymbols.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {enteredSymbols.map((sym) => (
                  <div
                    key={sym}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-sm font-semibold animate-in zoom-in-95 duration-200"
                  >
                    <span>{sym}</span>
                    <button
                      onClick={() => removeSymbol(sym)}
                      className="hover:text-white transition-colors"
                      aria-label={`Remove ${sym}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <span className="text-xs text-text-muted self-center ml-1">
                  ({enteredSymbols.length}/3 stocks)
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-button bg-danger/10 border border-danger/30 text-danger text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Comparison Cards */}
          <div
            className={`grid gap-6 ${
              results.length === 1
                ? "sm:grid-cols-1 max-w-md"
                : results.length === 2
                ? "sm:grid-cols-2"
                : "sm:grid-cols-3"
            }`}
          >
            {results.map((result) => (
              <ComparisonCard
                key={result.quote.symbol}
                quote={result.quote}
                aiScore={result.aiScore}
              />
            ))}
          </div>

          {/* Technical Score Bar Chart */}
          {results.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technical Score Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreBarChart data={chartData} />
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                  <LegendItem color="bg-secondary" label="Strong (80+)" />
                  <LegendItem color="bg-yellow-400" label="Moderate (50-79)" />
                  <LegendItem color="bg-danger" label="Caution (0-49)" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trade Verdict */}
          {aiVerdict && (
            <Card className="border-primary/40 shadow-glow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-text-primary">
                        Trade Verdict
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        System
                      </span>
                    </div>
                    <p className="text-text-primary text-sm leading-relaxed">
                      {aiVerdict}
                    </p>
                    <p className="text-xs text-text-muted mt-3">
                      ⚠️ This is System-generated analysis, not financial advice. Do
                      your own research before investing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && enteredSymbols.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">
            Start comparing stocks
          </h3>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Enter up to 3 stock symbols above and click &quot;Compare Stocks&quot; to
            see technical scores, live data, and an automated verdict.
          </p>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
