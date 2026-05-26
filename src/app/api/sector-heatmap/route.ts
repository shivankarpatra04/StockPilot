import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") || "30";

    const stocks = await prisma.scannedStock.findMany({
      where: { sector: { not: null } },
      select: { symbol: true, shortName: true, sector: true, price: true, change: true, analysisData: true }
    });

    // Group by sector and compute aggregate metrics
    const sectorMap: Record<string, {
      stocks: number;
      totalChange: number;
      totalScore: number;
      gainers: number;
      losers: number;
      topStock: string;
      topScore: number;
      upStocks: { symbol: string; shortName: string; change: number; price: number; score: number }[];
      downStocks: { symbol: string; shortName: string; change: number; price: number; score: number }[];
    }> = {};

    for (const stock of stocks) {
      const sector = stock.sector!;
      const analysis = (stock.analysisData as any)?.[days];
      if (!analysis) continue;

      if (!sectorMap[sector]) {
        sectorMap[sector] = { 
          stocks: 0, 
          totalChange: 0, 
          totalScore: 0, 
          gainers: 0, 
          losers: 0, 
          topStock: "", 
          topScore: 0,
          upStocks: [],
          downStocks: []
        };
      }

      const s = sectorMap[sector];
      s.stocks++;
      s.totalChange += analysis.change || 0;
      s.totalScore += analysis.score || 0;
      
      const stockItem = {
        symbol: stock.symbol,
        shortName: stock.shortName || "Unknown Stock",
        change: analysis.change || 0,
        price: stock.price || 0,
        score: analysis.score || 0
      };

      if ((analysis.change || 0) >= 0) {
        s.gainers++;
        s.upStocks.push(stockItem);
      } else {
        s.losers++;
        s.downStocks.push(stockItem);
      }

      if (analysis.score > s.topScore) {
        s.topScore = analysis.score;
        s.topStock = stock.symbol;
      }
    }

    const heatmap = Object.entries(sectorMap).map(([sector, data]) => {
      data.upStocks.sort((a, b) => b.change - a.change);
      data.downStocks.sort((a, b) => a.change - b.change);

      return {
        sector,
        stockCount: data.stocks,
        avgChange: data.stocks > 0 ? +(data.totalChange / data.stocks).toFixed(2) : 0,
        avgBuyScore: data.stocks > 0 ? Math.round(data.totalScore / data.stocks) : 0,
        gainers: data.gainers,
        losers: data.losers,
        sentiment: data.gainers > data.losers ? "bullish" : data.gainers < data.losers ? "bearish" : "neutral",
        topStock: data.topStock,
        topScore: data.topScore,
        upStocks: data.upStocks,
        downStocks: data.downStocks,
      };
    }).sort((a, b) => b.avgChange - a.avgChange);

    return NextResponse.json({ heatmap, days, timestamp: Date.now() });
  } catch (err) {
    console.error("[/api/sector-heatmap]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
