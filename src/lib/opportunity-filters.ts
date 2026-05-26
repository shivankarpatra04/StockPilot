// Shared filters used by both /api/best-trade and /api/opportunities
// so that Best Trade is guaranteed to surface inside the Opportunities tabs.

export type CategoryId = "swing" | "earnings" | "catchup" | "breakouts";

export interface EnrichedStock {
  symbol: string;
  sector: string | null;
  currentPrice: number;
  change: number;
  score: number;
  rsi: number;
  resistance: number;
  aboveSMA20?: boolean;
}

export interface CategoryTag {
  id: CategoryId;
  label: string;
  reason: string;
}

export const TIMEFRAMES = [1, 7, 15, 30, 60, 90] as const;

export function computeSectorAverages(stocks: { sector: string | null; change: number }[]): Record<string, number> {
  const buckets: Record<string, number[]> = {};
  for (const s of stocks) {
    if (!s.sector) continue;
    if (!buckets[s.sector]) buckets[s.sector] = [];
    buckets[s.sector].push(s.change);
  }
  const avgs: Record<string, number> = {};
  for (const sec of Object.keys(buckets)) {
    const arr = buckets[sec];
    avgs[sec] = arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  return avgs;
}

// Returns the list of opportunity categories a stock qualifies for.
// MUST stay in sync with the filters in /api/opportunities/route.ts.
export function categoriesFor(
  stock: EnrichedStock,
  sectorAverages: Record<string, number>
): CategoryTag[] {
  const tags: CategoryTag[] = [];

  // Swing: score >= 65 || score <= 35 || rsi > 70
  if (stock.score >= 65 || stock.score <= 35 || stock.rsi > 70) {
    const direction = stock.score >= 50 ? "LONG" : "SHORT";
    tags.push({
      id: "swing",
      label: "Swing Setup",
      reason: `Qualifies as a ${direction} swing trade with ${stock.score}% confidence.`,
    });
  }

  // Earnings: action != AVOID  →  score >= 68 || score <= 32
  if (stock.score >= 68 || stock.score <= 32) {
    const sentiment = stock.score >= 68 ? "Beat Likely" : "Miss Risk";
    tags.push({
      id: "earnings",
      label: "Earnings Catalyst",
      reason: `${sentiment} — chart shows ${stock.score >= 60 ? "accumulation" : "distribution"} before next results.`,
    });
  }

  // Catch-up: score >= 70 && sector gap > 1.0
  if (stock.sector && stock.score >= 70) {
    const avg = sectorAverages[stock.sector] ?? 0;
    const gap = avg - stock.change;
    if (gap > 1.0) {
      tags.push({
        id: "catchup",
        label: "Sector Catch-Up",
        reason: `${stock.sector} sector up ${avg.toFixed(1)}% but this stock lags by ${gap.toFixed(1)}%.`,
      });
    }
  }

  // Breakouts: resistance > 0 && price >= resistance*0.97 && score >= 58
  if (stock.resistance > 0 && stock.currentPrice >= stock.resistance * 0.97 && stock.score >= 58) {
    const cleared = stock.currentPrice >= stock.resistance;
    tags.push({
      id: "breakouts",
      label: "Technical Breakout",
      reason: cleared
        ? `Price cleared resistance at ₹${stock.resistance.toFixed(2)}.`
        : `Price approaching resistance at ₹${stock.resistance.toFixed(2)}.`,
    });
  }

  return tags;
}
