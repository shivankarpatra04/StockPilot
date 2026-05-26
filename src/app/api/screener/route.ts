import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectorQuery = searchParams.get("sector") || "";
    const sectors = sectorQuery ? sectorQuery.split(",").filter(s => s && s !== "All") : [];
    const days = searchParams.get("days") || "30";
    const minScore = parseInt(searchParams.get("minScore") || "0");
    const filterQuery = searchParams.get("filter") || "";
    const filters = filterQuery ? filterQuery.split(",").filter(f => f && f !== "All") : [];

    const where: any = {};
    if (sectors.length > 0) {
      where.sector = { in: sectors };
    }

    const cachedStocks = await prisma.scannedStock.findMany({
      where,
      orderBy: { lastUpdated: "desc" }
    });

    const formatted = cachedStocks.map(stock => {
      const analysis = (stock.analysisData as any)?.[days];
      const score = analysis?.score ?? 0;
      const rsi = analysis?.rsi ?? 50;
      const aboveSMA20 = analysis?.aboveSMA20 ?? false;
      const change = analysis?.change ?? stock.change;

      // Determine tags & badge
      let tags: string[] = [];
      let metricBadge = "";
      let badgeVariant = "default";

      if (score >= 75) { tags.push("Strong Fundamentals"); tags.push("Strong Buy"); }
      else if (score >= 60) { tags.push("Strong Fundamentals"); }
      if (rsi < 35) { tags.push("Oversold"); metricBadge = `RSI ${rsi}`; badgeVariant = "destructive"; }
      if (change > 3) { tags.push("High Volume"); metricBadge = `+${change.toFixed(1)}%`; badgeVariant = "warning"; }
      if (aboveSMA20 && change > 1) { tags.push("52-Week High"); metricBadge = "Trending"; badgeVariant = "secondary"; }
      if (stock.pe && stock.pe < 15) { tags.push("Low P/E"); metricBadge = `P/E ${stock.pe.toFixed(1)}`; badgeVariant = "success"; }
      if (tags.length === 0) { tags.push("Strong Fundamentals"); metricBadge = score ? `Score ${score}` : "Stable"; }
      if (!metricBadge) metricBadge = `Score ${score}`;

      return {
        symbol: stock.symbol,
        shortName: stock.shortName || stock.symbol,
        sector: stock.sector,
        regularMarketPrice: stock.price,
        regularMarketChangePercent: change,
        trailingPE: stock.pe,
        regularMarketVolume: stock.volume,
        averageVolume: stock.avgVolume,
        fiftyDayAverage: stock.fiftyDayMA,
        buyScore: score,
        rsi,
        aboveSMA20,
        currency: stock.symbol.includes(":NSE") ? "INR" : "USD",
        tags,
        metricBadge,
        badgeVariant,
      };
    }).filter(s => s.buyScore >= minScore);

    // Apply multiple filter tags (AND logic)
    const filtered = filters.length > 0
      ? formatted.filter(s => filters.every(f => s.tags.includes(f)))
      : formatted;

    // Sort by score descending
    filtered.sort((a, b) => b.buyScore - a.buyScore);

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[/api/screener] Error:", err);
    return NextResponse.json({ error: "Failed to fetch screener data." }, { status: 500 });
  }
}
