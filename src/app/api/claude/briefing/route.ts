export const dynamic = "force-dynamic";

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
      // "Expert" = plain, beginner-friendly ENGLISH. Jargon is explained inline.
      const moodWord =
        sentiment === "Bullish" ? "mostly going up" :
        sentiment === "Bearish" ? "mostly going down" : "mixed — no clear direction";

      data = {
        mode: "expert",
        title: `Today's Market Update — ${today}`,
        summary: `Out of ${total} big Indian companies we track, ${gainers} went up and ${losers} went down over the last ${days} days. ` +
          `So the market is ${moodWord} right now (about ${((gainers / total) * 100).toFixed(0)} out of every 100 stocks are rising). ` +
          (topSector ? `The ${topSector.name} group of companies is doing best, ${pct(topSector.avg)} on average. ` : "") +
          (weakSector && weakSector.name !== topSector?.name
            ? `The ${weakSector.name} group is the weakest at ${pct(weakSector.avg)}.`
            : ""),
        bulletPoints: [
          topSector && secondSector
            ? {
                label: `Strongest groups: ${topSector.name} & ${secondSector.name}`,
                text: `Money is flowing into ${topSector.name} (${pct(topSector.avg)}) and ${secondSector.name} (${pct(secondSector.avg)}). The ${weakSector?.name} group (${pct(weakSector?.avg ?? 0)}) is lagging — it may catch up later, so keep an eye on it.`,
              }
            : { label: "Sectors", text: "Not enough sector data for this time period yet." },
          topGainer && topLoser
            ? {
                label: `Biggest mover: ${name(topGainer)} ${pct(topGainer.change)}`,
                text: `${name(topGainer)} is the top gainer at ${pct(topGainer.change)}, with a health score of ${topGainer.score} out of 100. On the other side, ${name(topLoser)} fell ${pct(topLoser.change)}. ` +
                  (topLoser.rsi < 40 ? `It now looks oversold (beaten down too much), so it could bounce back.` : `Watch ${name(topLoser)} in case it keeps falling.`),
              }
            : { label: "Price action", text: "Price data is loading." },
          topScore
            ? {
                label: `Best-rated stock: ${name(topScore)} · ${topScore.score}/100`,
                text: `${name(topScore)} has the highest health score (${topScore.score} out of 100) over the last ${days} days. In plain terms: its price trend and strength look the best in the list right now.`,
              }
            : { label: "Top pick", text: "Pick data is loading." },
        ].filter(Boolean),
        checklist: [
          {
            id: "e1",
            text: `Take a look at ${topSector?.name ?? "the leading"} stocks — this group is up ${pct(topSector?.avg ?? 0)} over ${days} days.`,
          },
          {
            id: "e2",
            text: topScore
              ? `Study ${name(topScore)} first — it's the best-rated (${topScore.score}/100, ${pct(topScore.change)} over ${days} days). Never buy blindly; understand why.`
              : "Open the Best Trade card to see today's top-rated stock.",
          },
          {
            id: "e3",
            text: oversold
              ? `Keep an eye on ${name(oversold)} — it looks oversold (fell too much), which sometimes leads to a bounce. Check with your advisor first.`
              : "Browse the Opportunities tab for ready-to-study trade ideas.",
          },
        ],
      };
    } else {
      // "Simple" = HINGLISH + emojis, for users not comfortable with English.
      const moodWord =
        sentiment === "Bullish" ? "zyadatar UPAR ja raha hai 📈" :
        sentiment === "Bearish" ? "zyadatar NEECHE ja raha hai 📉" : "mila-jula hai 🤷 — koi saaf direction nahi";

      data = {
        mode: "simple",
        title: `Aaj ka Market Update — ${today} 👋`,
        summary: `${total} badi Indian companies me se ${gainers} upar gayi 📈 aur ${losers} neeche aayi 📉 (pichle ${days} dino me). ` +
          `Matlab market abhi ${moodWord}. ` +
          (topSector ? `Sabse acche chal rahe hain ${topSector.name} ke stocks 🔥` : ""),
        bulletPoints: [
          topSector
            ? {
                label: `🔥 Aaj ka best group: ${topSector.name}`,
                text: `${topSector.name} ke stocks average ${pct(topSector.avg)} upar hain. Agar aapke paas in me se koi stock hai, toh ye acchi khabar hai 🎉`,
              }
            : { label: "Sector", text: "Sector ka data abhi taiyaar ho raha hai ⏳" },
          topGainer
            ? {
                label: `🏆 Sabse bada winner: ${name(topGainer)}`,
                text: `${name(topGainer)} aaj ${pct(topGainer.change)} upar hai — sabse strong stocks me se ek 💪. Hamara system ise ${topGainer.score}/100 score deta hai.`,
              }
            : { label: "Top winner", text: "Data aa raha hai ⏳" },
          topScore
            ? {
                label: `⭐ Aaj ki smart pick: ${name(topScore)}`,
                text: `Hamare system ne ${name(topScore)} ko sabse zyada score diya (${topScore.score}/100) — kyunki pichle ${days} dino me iski chaal sabse achhi rahi 📈`,
              }
            : { label: "Smart pick", text: "Recommendation taiyaar ho rahi hai ⏳" },
        ].filter(Boolean),
        checklist: [
          {
            id: "s1",
            text: topScore
              ? `👉 ${name(topScore)} ko dekho — abhi hamari #1 pick hai (${topScore.score}/100 score).`
              : "Best Trade card kholo — aaj ki top pick wahan milegi.",
          },
          {
            id: "s2",
            text: topSector
              ? `👀 ${topSector.name} ke stocks par nazar daalo — ye group aaj market me sabse aage hai.`
              : "Sector Heatmap dekho — pata chalega kaunsa group hil raha hai.",
          },
          {
            id: "s3",
            text: oversold
              ? `${name(oversold)} kaafi gir chuka hai — wapas upar aa sakta hai 🔄. Beginners: pehle apne advisor se poochho 🙏`
              : "Opportunities page dekho — ready trade ideas wahan milenge.",
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
        title: "Market briefing temporarily unavailable.",
        summary:
          "We are currently experiencing slight delays in retrieving market data. Please try refreshing in a moment.",
        bulletPoints: [],
        checklist: [],
      },
      { status: 200 }
    );
  }
}
