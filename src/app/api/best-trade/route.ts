export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiError } from "@/types";
import {
  categoriesFor,
  computeSectorAverages,
  TIMEFRAMES,
  type CategoryId,
  type CategoryTag,
} from "@/lib/opportunity-filters";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { days = 30 } = await request.json();

    const cachedStocks = await prisma.scannedStock.findMany({
      orderBy: { lastUpdated: 'desc' }
    });

    if (cachedStocks.length === 0) {
      return NextResponse.json<ApiError>(
        { error: "Database cache is empty. Please run the background scanner first." },
        { status: 404 }
      );
    }

    // Most-recent scan timestamp — shared between Best Trade and Opportunities
    // so the user can verify they're looking at the same snapshot.
    const dataAsOf = cachedStocks.reduce<number>((max, s) => {
      const t = new Date(s.lastUpdated).getTime();
      return t > max ? t : max;
    }, 0);

    const enriched = cachedStocks.map((stock) => {
      const analysis = (stock.analysisData as any)?.[String(days)];
      if (!analysis) return null;
      return {
        symbol: stock.symbol,
        sector: stock.sector,
        currentPrice: stock.price,
        change: analysis.change,
        score: analysis.score,
        rsi: analysis.rsi,
        reasoning: analysis.reasoning,
        support: analysis.support,
        resistance: analysis.resistance,
        stopLoss: analysis.stopLoss,
        target: analysis.target,
        aboveSMA20: analysis.aboveSMA20
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    if (enriched.length === 0) {
      return NextResponse.json<ApiError>(
        { error: `No analysis data available for ${days} days timeframe.` },
        { status: 404 }
      );
    }

    const sectorAverages = computeSectorAverages(enriched);

    // Tag every enriched stock with the opportunity categories it qualifies for.
    const tagged = enriched.map((s) => ({
      ...s,
      categories: categoriesFor(s, sectorAverages),
    }));

    // SINGLE SOURCE OF TRUTH: the #1 pick must come from the same pool the
    // Opportunities page renders. Restrict candidates to stocks that qualify
    // for at least one category, then take the highest scoring one.
    const opportunityPool = tagged.filter((s) => s.categories.length > 0);

    // Fallback: if nothing qualifies (rare — early after a fresh scan), pick
    // from the full enriched list so the card never goes empty.
    const candidatePool = opportunityPool.length > 0 ? opportunityPool : tagged;
    candidatePool.sort((a, b) => b.score - a.score);
    const best = candidatePool[0];

    // Now scan ALL timeframes for the chosen stock so we can tell the user
    // "Also appears in Swing Setup · 90D" even when their current view is 30D.
    const bestRow = cachedStocks.find((s) => s.symbol === best.symbol);
    const bestAnalysisAll = (bestRow?.analysisData as any) ?? {};

    type TimedCategory = CategoryTag & { days: number };
    const matchesByCategory: Record<CategoryId, TimedCategory[]> = {
      swing: [], earnings: [], catchup: [], breakouts: [],
    };

    for (const tf of TIMEFRAMES) {
      const a = bestAnalysisAll[String(tf)];
      if (!a) continue;

      // Per-timeframe sector averages (needed for accurate catchup detection).
      const tfStocks = cachedStocks
        .map((s) => {
          const ta = (s.analysisData as any)?.[String(tf)];
          if (!ta) return null;
          return { sector: s.sector, change: ta.change as number };
        })
        .filter((s): s is { sector: string | null; change: number } => s !== null);
      const tfSectorAvgs = computeSectorAverages(tfStocks);

      const tags = categoriesFor(
        {
          symbol: best.symbol,
          sector: best.sector,
          currentPrice: bestRow?.price ?? best.currentPrice,
          change: a.change,
          score: a.score,
          rsi: a.rsi,
          resistance: a.resistance,
          aboveSMA20: a.aboveSMA20,
        },
        tfSectorAvgs
      );

      for (const tag of tags) {
        matchesByCategory[tag.id].push({ ...tag, days: tf });
      }
    }

    // Pick one badge per category: prefer the user's current timeframe if it
    // qualifies, otherwise the closest timeframe (smallest |diff|).
    const enrichedCategories: TimedCategory[] = [];
    (Object.keys(matchesByCategory) as CategoryId[]).forEach((id) => {
      const matches = matchesByCategory[id];
      if (matches.length === 0) return;
      const exact = matches.find((m) => m.days === days);
      const chosen =
        exact ??
        matches.reduce((best, cur) =>
          Math.abs(cur.days - days) < Math.abs(best.days - days) ? cur : best
        );
      enrichedCategories.push(chosen);
    });

    // Sort: user's current timeframe first, then by category order swing→earnings→catchup→breakouts.
    const order: CategoryId[] = ["swing", "earnings", "catchup", "breakouts"];
    enrichedCategories.sort((a, b) => {
      const aExact = a.days === days ? 0 : 1;
      const bExact = b.days === days ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

    const primaryCategory: CategoryId | null = enrichedCategories[0]?.id ?? null;

    const allCompared = enriched.map(s => ({
      symbol: s.symbol,
      currentPrice: s.currentPrice,
      change: s.change,
      score: s.score
    }));

    return NextResponse.json({
      bestTrade: {
        symbol: best.symbol,
        currentPrice: best.currentPrice,
        change: best.change,
        score: best.score,
        reasoning: best.reasoning,
        support: best.support,
        resistance: best.resistance,
        stopLoss: best.stopLoss,
        target: best.target,
        categories: enrichedCategories,
        primaryCategory
      },
      allCompared,
      dataAsOf,
      timestamp: Date.now()
    });

  } catch (err) {
    console.error("[/api/best-trade] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch best trade recommendation.", details: String(err) },
      { status: 500 }
    );
  }
}
