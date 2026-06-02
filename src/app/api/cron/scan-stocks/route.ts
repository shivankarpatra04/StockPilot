export const dynamic = "force-dynamic";
export const maxDuration = 60; // Hobby caps at 10s; Pro extends. Function exits early via queue chunking.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockData } from "@/lib/stocks";
import { STOCK_UNIVERSE } from "@/lib/nifty500";
import { calculateBuyScore } from "@/lib/score";

const TIMEFRAMES = [1, 7, 15, 30, 60, 90];

// Resumable scan: each invocation processes a small chunk of stocks that are
// missing from the cache or older than STALE_HOURS. Designed for the Hobby
// 10-second function limit — call this endpoint frequently (every minute) via
// an external cron (cron-job.org) and it will gradually refresh the universe.
const STALE_HOURS = 18;
const PROCESS_PER_CALL = 8;

export async function GET(request: Request) {
  // Optional protection: if CRON_SECRET is set, require a matching bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  // Build a freshness map of what's already in the DB.
  const existing = await prisma.scannedStock.findMany({
    select: { symbol: true, lastUpdated: true },
  });
  const lastUpdatedBy: Record<string, Date> = {};
  for (const row of existing) lastUpdatedBy[row.symbol] = row.lastUpdated;

  // Find symbols missing or stale, then take only PROCESS_PER_CALL of them.
  const allStale = STOCK_UNIVERSE.filter(({ symbol }) => {
    const last = lastUpdatedBy[symbol];
    return !last || last < staleThreshold;
  });

  if (allStale.length === 0) {
    return NextResponse.json({
      success: true,
      message: "All stocks up to date",
      total: STOCK_UNIVERSE.length,
      stale: 0,
    });
  }

  const queue = allStale.slice(0, PROCESS_PER_CALL);
  const results: string[] = [];
  const errors: string[] = [];

  await Promise.all(queue.map(async ({ symbol, name, sector }) => {
    try {
      const analysisData: Record<string, any> = {};

      const data90 = await fetchStockData(symbol, 90);
      if (!data90?.candles?.length) {
        errors.push(`No candles: ${symbol}`);
        return;
      }

      let latestCandle = null;
      let startCandle = null;

      TIMEFRAMES.forEach(days => {
        const sliced = data90.candles.slice(-days);
        const res = calculateBuyScore(sliced, symbol);
        if (res) {
          analysisData[String(days)] = res;
          if (days === 30) {
            latestCandle = data90.candles[data90.candles.length - 1];
            startCandle = data90.candles[Math.max(0, data90.candles.length - days)];
          }
        }
      });

      if (!latestCandle) {
        latestCandle = data90.candles[data90.candles.length - 1];
        startCandle = data90.candles[0];
      }

      const lc = latestCandle as any;
      const sc = startCandle as any;
      const change = sc ? ((lc.close - sc.close) / sc.close) * 100 : 0;

      const count50 = Math.min(50, data90.candles.length);
      const ma50 = data90.candles.slice(-count50).reduce((s: number, c: any) => s + (c.close || 0), 0) / count50;

      await prisma.scannedStock.upsert({
        where: { symbol },
        update: {
          shortName: name,
          sector,
          price: lc.close,
          change: +change.toFixed(2),
          volume: lc.volume || 0,
          fiftyDayMA: +ma50.toFixed(2),
          analysisData,
          lastUpdated: new Date()
        },
        create: {
          symbol,
          shortName: name,
          sector,
          price: lc.close,
          change: +change.toFixed(2),
          volume: lc.volume || 0,
          fiftyDayMA: +ma50.toFixed(2),
          analysisData
        }
      });
      results.push(symbol);
    } catch (err) {
      errors.push(`${symbol}: ${String(err).slice(0, 80)}`);
    }
  }));

  return NextResponse.json({
    success: true,
    processed: results.length,
    remaining: allStale.length - results.length,
    total: STOCK_UNIVERSE.length,
    errors,
  });
}
