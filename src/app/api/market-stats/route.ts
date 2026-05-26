export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") || "30";

    const stocks = await prisma.scannedStock.findMany({
      select: {
        symbol: true,
        shortName: true,
        sector: true,
        price: true,
        change: true,
        volume: true,
        analysisData: true,
      }
    });

    if (stocks.length === 0) {
      return NextResponse.json({ error: "No cached stocks. Run the background scanner." }, { status: 404 });
    }

    // Pull per-timeframe change from analysisData
    const withChange = stocks.map(s => {
      const a = (s.analysisData as any)?.[days];
      return {
        symbol: s.symbol,
        shortName: s.shortName,
        sector: s.sector,
        price: s.price,
        change: a?.change ?? s.change,      // timeframe-specific change
        volume: s.volume ?? 0,
        score: a?.score ?? 0,
        rsi: a?.rsi ?? 50,
      };
    });

    // Sort by change
    const sorted = [...withChange].sort((a, b) => b.change - a.change);

    const topGainer = sorted[0] ?? null;
    const topLoser = sorted[sorted.length - 1] ?? null;
    const mostActive = [...withChange].sort((a, b) => b.volume - a.volume)[0] ?? null;

    const gainers = withChange.filter(s => s.change > 0).length;
    const losers = withChange.filter(s => s.change < 0).length;
    const sentiment =
      gainers > losers * 1.3 ? "Bullish" :
      losers > gainers * 1.3 ? "Bearish" : "Neutral";

    // Sector performance from DB
    const sectorMap: Record<
      string,
      {
        totalChange: number;
        count: number;
        gainers: number;
        losers: number;
        upStocks: { symbol: string; shortName: string | null; change: number; price: number }[];
        downStocks: { symbol: string; shortName: string | null; change: number; price: number }[];
      }
    > = {};

    for (const s of withChange) {
      if (!s.sector) continue;
      if (!sectorMap[s.sector]) {
        sectorMap[s.sector] = { totalChange: 0, count: 0, gainers: 0, losers: 0, upStocks: [], downStocks: [] };
      }
      sectorMap[s.sector].totalChange += s.change;
      sectorMap[s.sector].count++;

      const stockItem = {
        symbol: s.symbol,
        shortName: s.shortName,
        change: s.change,
        price: s.price,
        score: s.score,
        sector: s.sector,
      };

      if (s.change >= 0) {
        sectorMap[s.sector].gainers++;
        sectorMap[s.sector].upStocks.push(stockItem);
      } else {
        sectorMap[s.sector].losers++;
        sectorMap[s.sector].downStocks.push(stockItem);
      }
    }

    const sectorPerf = Object.entries(sectorMap).map(([name, d]) => {
      // Sort up stocks descending, down stocks ascending (biggest drops first)
      d.upStocks.sort((a, b) => b.change - a.change);
      d.downStocks.sort((a, b) => a.change - b.change);

      return {
        name,
        changePercent: d.count > 0 ? +(d.totalChange / d.count).toFixed(2) : 0,
        gainers: d.gainers,
        losers: d.losers,
        upStocks: d.upStocks,
        downStocks: d.downStocks,
        status: d.gainers > d.losers ? "Rising" : d.losers > d.gainers ? "Cooling" : "Neutral",
        statusColor: d.gainers > d.losers ? "text-green-400" : d.losers > d.gainers ? "text-red-400" : "text-yellow-400",
        borderColor: d.gainers > d.losers ? "border-t-green-400" : d.losers > d.gainers ? "border-t-red-400" : "border-t-yellow-400",
      };
    }).sort((a, b) => b.changePercent - a.changePercent);

    // Top opportunities (best scores)
    const topOpportunities = [...withChange]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({ ...s, label: s.score >= 70 ? "Strong Buy" : s.score >= 55 ? "Value Pick" : "Neutral" }));

    return NextResponse.json({
      sentiment,
      gainers,
      losers,
      total: withChange.length,
      topGainer,
      topLoser,
      mostActive,
      sectorPerf,
      topOpportunities,
      days,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[/api/market-stats]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
