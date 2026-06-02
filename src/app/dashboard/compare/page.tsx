// filepath: src/app/dashboard/compare/page.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComparisonCard from "@/components/ComparisonCard";
import ScoreBarChart from "@/components/ScoreBarChart";
import { Search, X, Sparkles, AlertCircle, Loader2, Crown } from "lucide-react";
import type { StockQuote } from "@/types";
import {
  COMPARE_GOALS,
  computeAIScoreForGoal,
  getStockInsights,
  getMetricWinners,
  getWinnerReason,
  type CompareGoal,
} from "@/lib/compare";

import StockSearch from "@/components/StockSearch";

const SUGGESTED_SYMBOLS = ["RELIANCE:NSE", "TCS:NSE", "INFY:NSE", "HDFCBANK:NSE", "ICICIBANK:NSE", "SBIN:NSE", "BHARTIARTL:NSE"];

export default function ComparePage() {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [enteredSymbols, setEnteredSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [goal, setGoal] = useState<CompareGoal>("balanced");
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Derive goal-weighted scores + ranking from raw quotes. Re-runs instantly
  // when the goal changes — no refetch needed.
  const ranked = useMemo(() => {
    const scored = quotes.map((quote) => ({
      quote,
      aiScore: computeAIScoreForGoal(quote, goal),
    }));
    const order = [...scored].sort((a, b) => b.aiScore.score - a.aiScore.score);
    const rankBySymbol = new Map<string, number>();
    order.forEach((item, i) => rankBySymbol.set(item.quote.symbol, i + 1));
    return { scored, order, rankBySymbol };
  }, [quotes, goal]);

  const metricWinners = useMemo(
    () => getMetricWinners(ranked.scored),
    [ranked.scored]
  );

  // Clear winner only when more than one stock and a true #1 (no tie at top).
  const topPick = useMemo(() => {
    if (ranked.order.length < 2) return null;
    const [first, second] = ranked.order;
    if (first.aiScore.score === second.aiScore.score) return null;
    return first;
  }, [ranked.order]);

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
    setQuotes([]);
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

      const validQuotes: StockQuote[] = [];
      const failedSymbols: string[] = [];

      quoteResponses.forEach((quote, idx) => {
        if (quote) validQuotes.push(quote);
        else failedSymbols.push(enteredSymbols[idx]);
      });

      if (validQuotes.length === 0) {
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

      setQuotes(validQuotes);

      // Fetch System verdict using the currently selected goal's scores.
      const scores = validQuotes.map(
        (q) => computeAIScoreForGoal(q, goal).score
      );
      try {
        const verdictRes = await fetch("/api/claude/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: validQuotes.map((q) => q.symbol),
            scores,
            days: analysisDays,
            mode: isSimpleMode ? "simple" : "expert",
          }),
        });
        const verdictData = (await verdictRes.json()) as { text: string };
        setAiVerdict(verdictData.text);
      } catch {
        setAiVerdict("System verdict temporarily unavailable. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("[Compare] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enteredSymbols, analysisDays, goal, isSimpleMode]);

  // Auto-compare when global range changes
  useEffect(() => {
    if (isMounted && quotes.length > 0 && !isLoading) {
      handleCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisDays]); // Only trigger on range change

  const chartData = ranked.scored.map((r) => ({
    symbol: r.quote.symbol,
    score: r.aiScore.score,
  }));

  const hasResults = quotes.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Stock Comparison</h1>
        <p className="text-text-muted text-sm mt-1">
          Compare up to 3 stocks side-by-side with technical scores and live data
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
      {hasResults && (
        <>
          {/* Goal selector — re-weights scores for what the user actually wants */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-2">
              What are you optimizing for?
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPARE_GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  title={g.description}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    goal === g.id
                      ? "bg-primary text-white border-primary shadow-glow"
                      : "border-border text-text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              {COMPARE_GOALS.find((g) => g.id === goal)?.description}
            </p>
          </div>

          {/* Winner banner */}
          {topPick && (
            <Card className="border-secondary/50 shadow-glow bg-secondary/5">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 shadow-md">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                        Top Pick
                      </span>
                      <span className="text-xs text-text-muted">
                        for {COMPARE_GOALS.find((g) => g.id === goal)?.label}
                      </span>
                    </div>
                    <p className="text-text-primary font-semibold mt-0.5">
                      {topPick.quote.shortName}{" "}
                      <span className="text-text-muted font-normal">
                        ({topPick.quote.symbol}) · score {topPick.aiScore.score}
                      </span>
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {getWinnerReason(topPick.quote, topPick.aiScore)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Cards */}
          <div
            className={`grid gap-6 ${
              ranked.scored.length === 1
                ? "sm:grid-cols-1 max-w-md"
                : ranked.scored.length === 2
                ? "sm:grid-cols-2"
                : "sm:grid-cols-3"
            }`}
          >
            {ranked.scored.map((result) => {
              const symbol = result.quote.symbol;
              return (
                <ComparisonCard
                  key={symbol}
                  quote={result.quote}
                  aiScore={result.aiScore}
                  rank={ranked.scored.length > 1 ? ranked.rankBySymbol.get(symbol) : undefined}
                  isWinner={topPick?.quote.symbol === symbol}
                  insights={getStockInsights(result.quote, result.aiScore)}
                  metricWins={{
                    pe: metricWinners.pe === symbol,
                    revGrowth: metricWinners.revGrowth === symbol,
                  }}
                />
              );
            })}
          </div>

          {/* Technical Score Bar Chart */}
          {ranked.scored.length > 1 && (
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
                      <h3 className="font-semibold text-text-primary">Trade Verdict</h3>
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
      {!isLoading && !hasResults && enteredSymbols.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">
            Start comparing stocks
          </h3>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Enter up to 3 stock symbols above and click &quot;Compare Now&quot; to
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
