export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const BATCH = 50; // symbols per Yahoo quote call
const DB_CONCURRENCY = 6; // concurrent DB writes — kept well under the ~15 pool limit

// Run async tasks with a fixed concurrency cap (throughput without exhausting
// the connection pool). Returns when all tasks settle.
async function runPooled<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let idx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

// Lightweight intraday refresh: updates only the live price / day-change / volume
// and the freshness timestamp for cached stocks. It deliberately does NOT
// recompute the heavy 90-day analysis (scores, support/resistance, targets) —
// that runs once daily via /api/cron/scan-stocks. Designed to run every ~15 min
// during market hours without hammering Yahoo (uses batched quote calls).
export async function GET(request: Request) {
  // Optional protection: if CRON_SECRET is set, require a matching bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const t0 = Date.now();
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const stocks = await prisma.scannedStock.findMany({
      select: { symbol: true },
      ...(limit ? { take: limit } : {}),
    });
    if (stocks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cache empty. Run the full scan first." },
        { status: 404 }
      );
    }

    // map yahoo symbol -> app symbol
    const map = new Map<string, string>();
    for (const s of stocks) {
      const y = s.symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");
      map.set(y, s.symbol);
    }
    const yahooSymbols = Array.from(map.keys());

    let updated = 0;
    let failed = 0;
    const now = new Date();

    // 1. Fetch all quotes (batched network calls), collecting the update payloads.
    const writes: { symbol: string; price: number; change?: number; volume?: number }[] = [];
    for (let i = 0; i < yahooSymbols.length; i += BATCH) {
      const chunk = yahooSymbols.slice(i, i + BATCH);
      try {
        const res = await yf.quote(chunk);
        const arr = Array.isArray(res) ? res : [res];
        for (const q of arr as any[]) {
          const appSymbol = map.get(q?.symbol);
          const price = q?.regularMarketPrice;
          if (!appSymbol || price == null) {
            failed++;
            continue;
          }
          writes.push({
            symbol: appSymbol,
            price: +Number(price).toFixed(2),
            change:
              q.regularMarketChangePercent != null
                ? +Number(q.regularMarketChangePercent).toFixed(2)
                : undefined,
            volume: q.regularMarketVolume != null ? Math.round(q.regularMarketVolume) : undefined,
          });
        }
      } catch {
        // whole batch failed (e.g. transient Yahoo error) — skip; next run retries
        failed += chunk.length;
      }
    }

    const fetchMs = Date.now() - t0;
    const wStart = Date.now();

    // 2. Apply DB writes with bounded concurrency so we never exhaust the pool.
    await runPooled(writes, DB_CONCURRENCY, async (w) => {
      try {
        await prisma.scannedStock.update({
          where: { symbol: w.symbol },
          data: { price: w.price, change: w.change, volume: w.volume, lastUpdated: now },
        });
        updated++;
      } catch {
        failed++;
      }
    });

    return NextResponse.json({
      success: true,
      updated,
      failed,
      total: yahooSymbols.length,
      fetchMs,
      writeMs: Date.now() - wStart,
      refreshedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[refresh-prices ERROR]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
