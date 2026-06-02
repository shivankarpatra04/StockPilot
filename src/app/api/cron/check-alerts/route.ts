export const dynamic = "force-dynamic";
export const maxDuration = 300; // fetches a live quote per unique symbol across all active alerts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockQuote } from "@/lib/stocks";

// Checks every active (not-yet-triggered) alert against the live price.
// When a price condition is met, the alert is marked triggered + unseen so the
// in-app notification bell can surface it to the user.
export async function GET(request: NextRequest) {
  // Optional protection: if CRON_SECRET is set, require a matching bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const activeAlerts = await prisma.alert.findMany({
      where: { triggered: false },
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({ success: true, checked: 0, triggered: 0 });
    }

    // Fetch each unique symbol once.
    const symbols = Array.from(new Set(activeAlerts.map(a => a.symbol)));
    const quotes: Record<string, number> = {};

    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const quote = await fetchStockQuote(sym);
          if (quote && typeof quote.regularMarketPrice === "number") {
            quotes[sym] = quote.regularMarketPrice;
          }
        } catch (err) {
          console.error(`[check-alerts] quote failed for ${sym}:`, err);
        }
      })
    );

    let triggeredCount = 0;
    const now = new Date();

    for (const alert of activeAlerts) {
      const price = quotes[alert.symbol];
      if (typeof price !== "number") continue;

      const hit =
        (alert.condition === "above" && price >= alert.targetPrice) ||
        (alert.condition === "below" && price <= alert.targetPrice);

      if (hit) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { triggered: true, triggeredAt: now, seen: false },
        });
        triggeredCount++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: activeAlerts.length,
      symbolsQuoted: Object.keys(quotes).length,
      triggered: triggeredCount,
    });
  } catch (err) {
    console.error("[check-alerts ERROR]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
