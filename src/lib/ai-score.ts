// filepath: src/lib/ai-score.ts
import type { StockQuote, AIScore } from "@/types";

export function computeAIScore(quote: StockQuote): AIScore {
  let score = 0;

  const dayChangeLarge = quote.regularMarketChangePercent > 2;
  const dayChangePositive = quote.regularMarketChangePercent > 0;
  const highVolume =
    quote.averageVolume > 0 &&
    quote.regularMarketVolume > quote.averageVolume;
  const aboveFiftyMA =
    quote.fiftyDayAverage !== null &&
    quote.regularMarketPrice > quote.fiftyDayAverage;
  const aboveTwoHundredMA =
    quote.twoHundredDayAverage !== null &&
    quote.regularMarketPrice > quote.twoHundredDayAverage;
  const lowPE =
    quote.trailingPE !== null &&
    quote.trailingPE > 0 &&
    quote.trailingPE < 25;

  if (dayChangeLarge) score += 20;
  else if (dayChangePositive) score += 10;
  if (highVolume) score += 15;
  if (aboveFiftyMA) score += 20;
  if (aboveTwoHundredMA) score += 20;
  if (lowPE) score += 15;

  // Ensure score stays within bounds
  score = Math.min(100, Math.max(0, score));

  let label: AIScore["label"];
  if (score >= 80) label = "Strong Buy";
  else if (score >= 60) label = "Bullish";
  else if (score >= 40) label = "Neutral";
  else label = "Caution";

  return {
    score,
    label,
    breakdown: {
      dayChangeLarge,
      dayChangePositive,
      highVolume,
      aboveFiftyMA,
      aboveTwoHundredMA,
      lowPE,
    },
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-secondary";
  if (score >= 50) return "text-yellow-400";
  return "text-danger";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-secondary/20 text-secondary border-secondary/40";
  if (score >= 50)
    return "bg-yellow-400/20 text-yellow-400 border-yellow-400/40";
  return "bg-danger/20 text-danger border-danger/40";
}
