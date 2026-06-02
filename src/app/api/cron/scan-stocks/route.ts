export const dynamic = "force-dynamic";
export const maxDuration = 300; // scans ~336 stocks in batches; needs a long timeout (Vercel Pro)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockData } from "@/lib/stocks";
import { STOCK_UNIVERSE } from "@/lib/nifty500";
import { calculateBuyScore } from "@/lib/score";

const TIMEFRAMES = [1, 7, 15, 30, 60, 90];

export async function GET() {
  const total = STOCK_UNIVERSE.length;
  console.log(`[CRON] Starting Nifty500 scan for ${total} stocks...`);
  const results: string[] = [];
  const errors: string[] = [];

  // Process in batches of 8 with 1.5s delay to avoid Yahoo rate limits
  const BATCH_SIZE = 8;
  for (let i = 0; i < STOCK_UNIVERSE.length; i += BATCH_SIZE) {
    const batch = STOCK_UNIVERSE.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async ({ symbol, name, sector }) => {
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

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`[CRON] Done. Cached: ${results.length}/${total}. Errors: ${errors.length}`);
  return NextResponse.json({ success: true, total, cached: results.length, errors });
}
