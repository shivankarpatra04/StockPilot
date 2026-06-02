// filepath: src/lib/compare.ts
import type { StockQuote, AIScore } from "@/types";
import { computeAIScore } from "@/lib/ai-score";

/**
 * Comparison goals. Each goal re-weights the same underlying technical factors
 * so the "winner" reflects what the user actually cares about.
 */
export type CompareGoal = "balanced" | "trade" | "hold" | "value" | "momentum";

export const COMPARE_GOALS: {
  id: CompareGoal;
  label: string;
  description: string;
}[] = [
  { id: "balanced", label: "Balanced", description: "All factors weighted evenly" },
  { id: "trade", label: "Short-term Trade", description: "Momentum & volume first" },
  { id: "hold", label: "Long-term Hold", description: "Trend & valuation first" },
  { id: "value", label: "Value", description: "Cheap relative to fundamentals" },
  { id: "momentum", label: "Momentum", description: "Strongest current move" },
];

type FactorKey = "momentum" | "volume" | "trend50" | "trend200" | "value";

// Per-goal weights. "balanced" reproduces the original computeAIScore exactly
// (20/15/20/20/15) so existing behaviour is preserved.
const GOAL_WEIGHTS: Record<CompareGoal, Record<FactorKey, number>> = {
  balanced: { momentum: 20, volume: 15, trend50: 20, trend200: 20, value: 15 },
  trade: { momentum: 30, volume: 25, trend50: 25, trend200: 10, value: 10 },
  hold: { momentum: 5, volume: 5, trend50: 20, trend200: 35, value: 35 },
  value: { momentum: 5, volume: 5, trend50: 10, trend200: 20, value: 60 },
  momentum: { momentum: 35, volume: 25, trend50: 25, trend200: 10, value: 5 },
};

/**
 * Re-score a quote for a specific goal. Returns the same AIScore shape (with the
 * unchanged factor breakdown) so existing UI keeps working — only the numeric
 * score and label change with the goal.
 */
export function computeAIScoreForGoal(
  quote: StockQuote,
  goal: CompareGoal
): AIScore {
  const base = computeAIScore(quote);
  const w = GOAL_WEIGHTS[goal];
  const b = base.breakdown;

  let score = 0;
  // Momentum scores full weight on a large move, half on a positive day.
  if (b.dayChangeLarge) score += w.momentum;
  else if (b.dayChangePositive) score += w.momentum / 2;
  if (b.highVolume) score += w.volume;
  if (b.aboveFiftyMA) score += w.trend50;
  if (b.aboveTwoHundredMA) score += w.trend200;
  if (b.lowPE) score += w.value;

  score = Math.round(Math.min(100, Math.max(0, score)));

  let label: AIScore["label"];
  if (score >= 80) label = "Strong Buy";
  else if (score >= 60) label = "Bullish";
  else if (score >= 40) label = "Neutral";
  else label = "Caution";

  return { score, label, breakdown: b };
}

export interface StockInsights {
  strengths: string[];
  weaknesses: string[];
  risks: string[];
}

/**
 * Plain-English strengths, weaknesses, and risk flags for a single stock so the
 * user sees the downside, not just the bull case.
 */
export function getStockInsights(quote: StockQuote, aiScore: AIScore): StockInsights {
  const b = aiScore.breakdown;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  // ---- Strengths ----
  if (b.dayChangeLarge) strengths.push("Strong upward momentum today");
  else if (b.dayChangePositive) strengths.push("Trading up on the day");
  if (b.highVolume) strengths.push("Above-average trading volume");
  if (b.aboveFiftyMA) strengths.push("Trading above 50-day average");
  if (b.aboveTwoHundredMA) strengths.push("In a long-term uptrend (above 200MA)");
  if (b.lowPE) strengths.push("Attractive valuation (P/E under 25)");
  if (quote.revenueGrowth !== null && quote.revenueGrowth > 0.15)
    strengths.push("Strong revenue growth");

  // ---- Weaknesses ----
  if (quote.regularMarketChangePercent < 0) weaknesses.push("Down on the day");
  if (!b.aboveFiftyMA) weaknesses.push("Below 50-day average");
  if (!b.aboveTwoHundredMA) weaknesses.push("Below 200-day average (weak trend)");
  if (quote.trailingPE !== null && quote.trailingPE >= 35)
    weaknesses.push("Expensive valuation (high P/E)");
  if (
    quote.averageVolume > 0 &&
    quote.regularMarketVolume < quote.averageVolume
  )
    weaknesses.push("Below-average volume");
  if (quote.revenueGrowth !== null && quote.revenueGrowth < 0)
    weaknesses.push("Declining revenue");

  // ---- Risk flags ----
  const range = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow;
  if (range > 0) {
    const fromHigh =
      (quote.fiftyTwoWeekHigh - quote.regularMarketPrice) / quote.fiftyTwoWeekHigh;
    const fromLow =
      (quote.regularMarketPrice - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow;
    if (fromHigh <= 0.03) risks.push("Near 52-week high — limited upside");
    else if (fromLow <= 0.05) risks.push("Near 52-week low — possible falling knife");
  }
  if (
    quote.averageVolume > 0 &&
    quote.regularMarketVolume < quote.averageVolume * 0.5
  )
    risks.push("Thin liquidity — harder to exit");
  if (quote.trailingPE !== null && quote.trailingPE > 50)
    risks.push("Stretched valuation (P/E over 50)");
  if (Math.abs(quote.regularMarketChangePercent) > 5)
    risks.push("High volatility today");

  return { strengths, weaknesses, risks };
}

export interface ComparisonItem {
  quote: StockQuote;
  aiScore: AIScore;
}

/**
 * For each comparable metric, the symbol that "wins" it. Used to highlight the
 * best value per row so the eye lands on the right cell instantly.
 */
export interface MetricWinners {
  score: string | null; // highest score
  pe: string | null; // lowest positive P/E
  revGrowth: string | null; // highest revenue growth
}

export function getMetricWinners(items: ComparisonItem[]): MetricWinners {
  if (items.length < 2) return { score: null, pe: null, revGrowth: null };

  const best = <T>(
    getValue: (i: ComparisonItem) => T | null,
    better: (a: T, b: T) => boolean
  ): string | null => {
    let winner: ComparisonItem | null = null;
    let winnerVal: T | null = null;
    for (const item of items) {
      const v = getValue(item);
      if (v === null) continue;
      if (winnerVal === null || better(v, winnerVal)) {
        winner = item;
        winnerVal = v;
      }
    }
    return winner ? winner.quote.symbol : null;
  };

  return {
    score: best((i) => i.aiScore.score, (a, b) => a > b),
    pe: best(
      (i) => (i.quote.trailingPE && i.quote.trailingPE > 0 ? i.quote.trailingPE : null),
      (a, b) => a < b
    ),
    revGrowth: best((i) => i.quote.revenueGrowth, (a, b) => a > b),
  };
}

/**
 * One-line reason the top pick won, for the winner banner.
 */
export function getWinnerReason(quote: StockQuote, aiScore: AIScore): string {
  const { strengths } = getStockInsights(quote, aiScore);
  if (strengths.length === 0) return "Highest overall technical score in this comparison.";
  return strengths.slice(0, 2).join(" · ");
}
