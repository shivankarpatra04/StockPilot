import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "expert";
    const days = searchParams.get("days") || "30";

    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Pull real market data from DB
    const stocks = await prisma.scannedStock.findMany({
      select: {
        symbol: true,
        shortName: true,
        sector: true,
        price: true,
        analysisData: true,
      },
    });

    type StockRow = {
      symbol: string;
      shortName: string | null;
      sector: string | null;
      price: number;
      score: number;
      change: number;
      rsi: number;
      reasoning: string;
    };

    const enriched: StockRow[] = stocks
      .flatMap((s) => {
        const a = (s.analysisData as any)?.[days];
        if (!a) return [];
        const row: StockRow = {
          symbol: s.symbol,
          shortName: s.shortName,
          sector: s.sector,
          price: s.price,
          score: a.score ?? 0,
          change: a.change ?? 0,
          rsi: a.rsi ?? 50,
          reasoning: a.reasoning ?? "",
        };
        return [row];
      });

    // --- Market-wide stats ---
    const gainers = enriched.filter((s) => s.change > 0).length;
    const losers = enriched.filter((s) => s.change < 0).length;
    const total = enriched.length;
    const sentiment =
      gainers > losers * 1.3 ? "Bullish" : losers > gainers * 1.3 ? "Bearish" : "Neutral";

    const sorted = [...enriched].sort((a, b) => b.change - a.change);
    const topGainer = sorted[0];
    const topLoser = sorted[sorted.length - 1];
    const topScore = [...enriched].sort((a, b) => b.score - a.score)[0];
    const oversold = enriched.filter((s) => s.rsi < 35).sort((a, b) => a.rsi - b.rsi)[0];

    // --- Sector averages ---
    const sectorBuckets: Record<string, { total: number; count: number }> = {};
    for (const s of enriched) {
      if (!s.sector) continue;
      if (!sectorBuckets[s.sector]) sectorBuckets[s.sector] = { total: 0, count: 0 };
      sectorBuckets[s.sector].total += s.change;
      sectorBuckets[s.sector].count += 1;
    }
    const sectorAvgs = Object.entries(sectorBuckets)
      .map(([name, { total, count }]) => ({ name, avg: total / count }))
      .sort((a, b) => b.avg - a.avg);
    const topSector = sectorAvgs[0];
    const weakSector = sectorAvgs[sectorAvgs.length - 1];
    const secondSector = sectorAvgs[1];

    // --- Helpers ---
    const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
    const name = (s: StockRow) => s.shortName ?? s.symbol.split(":")[0];

    // --- Build briefing ---
    let data: any;

    if (mode === "expert") {
      const sentimentEmoji =
        sentiment === "Bullish" ? "🟢" : sentiment === "Bearish" ? "🔴" : "🟡";

      data = {
        mode: "expert",
        title: `📊 Market Briefing — ${sentiment} ${sentimentEmoji} · ${today}`,
        summary: `${days}-day scan of ${total} Nifty 500 stocks shows ${gainers} gainers and ${losers} losers. ` +
          `Market breadth is ${sentiment.toLowerCase()}, with ${((gainers / total) * 100).toFixed(0)}% of stocks advancing. ` +
          (topSector
            ? `${topSector.name} leads all sectors at ${pct(topSector.avg)} average move. `
            : "") +
          (weakSector && weakSector.name !== topSector?.name
            ? `${weakSector.name} is the laggard at ${pct(weakSector.avg)}.`
            : ""),
        bulletPoints: [
          topSector && secondSector
            ? {
                label: `Sector Rotation — ${topSector.name} ${topSector.avg >= 0 ? "↑" : "↓"}`,
                text: `${topSector.name} (${pct(topSector.avg)}) and ${secondSector.name} (${pct(secondSector.avg)}) are leading the rotation. ${weakSector?.name} (${pct(weakSector?.avg ?? 0)}) is underperforming — watch for catch-up setups there.`,
              }
            : { label: "Sector Data", text: "Insufficient sector data for this timeframe." },
          topGainer && topLoser
            ? {
                label: `Top Mover — ${name(topGainer)} ${pct(topGainer.change)}`,
                text: `${name(topGainer)} leads all gainers at ${pct(topGainer.change)} with buy score ${topGainer.score}. On the downside, ${name(topLoser)} has dropped ${pct(topLoser.change)}. ` +
                  (topLoser.rsi < 40 ? `RSI at ${topLoser.rsi} — potential reversal zone forming.` : `Monitor ${name(topLoser)} for continuation risk.`),
              }
            : { label: "Price Action", text: "Price data loading." },
          topScore
            ? {
                label: `Highest Buy Score — ${name(topScore)} · ${topScore.score}%`,
                text: `${name(topScore)} ranks #1 with a buy score of ${topScore.score}% over the last ${days} days. ${topScore.reasoning}`,
              }
            : { label: "Top Signal", text: "Signal data loading." },
        ].filter(Boolean),
        checklist: [
          {
            id: "e1",
            text: `Review ${topSector?.name ?? "leading"} sector stocks — sector is up ${pct(topSector?.avg ?? 0)} over ${days}D`,
          },
          {
            id: "e2",
            text: topScore
              ? `Consider ${name(topScore)} as a primary entry — buy score ${topScore.score}%, ${pct(topScore.change)} over ${days}D`
              : "Review high buy-score stocks from the Best Trade card",
          },
          {
            id: "e3",
            text: oversold
              ? `Watch ${name(oversold)} — RSI deeply oversold at ${oversold.rsi}, potential bounce setup forming`
              : "Scan for oversold RSI (<35) setups in the Opportunities tab",
          },
        ],
      };
    } else {
      // Simple mode — beginner-friendly language
      const moodEmoji =
        sentiment === "Bullish" ? "😊" : sentiment === "Bearish" ? "😟" : "😐";
      const moodWord =
        sentiment === "Bullish" ? "mostly going UP today" :
        sentiment === "Bearish" ? "mostly going DOWN today" : "going sideways — mixed signals";

      data = {
        mode: "simple",
        title: `${moodEmoji} Market Update — ${today}`,
        summary: `Out of ${total} big Indian stocks, ${gainers} are going up and ${losers} are going down right now. ` +
          `The overall market is ${moodWord}. ` +
          (topSector ? `The ${topSector.name} sector is doing the best today.` : ""),
        bulletPoints: [
          topSector
            ? {
                label: `Best sector today: ${topSector.name} 🏆`,
                text: `${topSector.name} stocks are up an average of ${pct(topSector.avg)}. If you own stocks in this group, that's great news!`,
              }
            : { label: "Sector Update", text: "Sector data is being processed." },
          topGainer
            ? {
                label: `Biggest winner: ${name(topGainer)} 🚀`,
                text: `${name(topGainer)} is up ${pct(topGainer.change)} — one of the strongest movers right now. Our system gives it a confidence score of ${topGainer.score}%.`,
              }
            : { label: "Top Gainer", text: "Data loading." },
          topScore
            ? {
                label: `Today's smart pick: ${name(topScore)} ⭐`,
                text: `Our AI gave ${name(topScore)} the highest buy signal (${topScore.score}%) based on its price pattern and trend over the last ${days} days.`,
              }
            : { label: "Smart Pick", text: "Processing recommendations." },
        ].filter(Boolean),
        checklist: [
          {
            id: "s1",
            text: topScore
              ? `Check out ${name(topScore)} — our #1 pick right now with ${topScore.score}% confidence`
              : "Visit the Best Trade card for today's top recommendation",
          },
          {
            id: "s2",
            text: topSector
              ? `Look at ${topSector.name} stocks — this sector is the market leader today`
              : "Explore the Sector Heatmap to see which sectors are moving",
          },
          {
            id: "s3",
            text: oversold
              ? `${name(oversold)} looks oversold — may bounce back soon. Beginners: check with your advisor first`
              : "Review the Opportunities page for ready-to-act trade ideas",
          },
        ],
      };
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for 15 minutes — fresh enough without hammering the DB
        "Cache-Control": "private, s-maxage=900, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("[/api/claude/briefing] Error:", err);
    return NextResponse.json(
      {
        mode: "simple",
        title: "⚠️ Market briefing temporarily unavailable.",
        summary:
          "We are currently experiencing slight delays in retrieving market data. Please try refreshing in a moment.",
        bulletPoints: [],
        checklist: [],
      },
      { status: 200 }
    );
  }
}
