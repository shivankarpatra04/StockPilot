export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockData } from "@/lib/stocks";
import { STOCK_UNIVERSE } from "@/lib/nifty500";

const TIMEFRAMES = [1, 7, 15, 30, 60, 90];

function calculateRSI(candles: any[]): number {
  if (candles.length < 14) return 50;
  let gains = 0, losses = 0;
  for (let i = candles.length - 14; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
}

function calculateBuyScore(candles: any[], symbol: string) {
  const valid = candles.filter(c => c && c.close != null && !isNaN(c.close) && c.low != null && !isNaN(c.low) && c.high != null && !isNaN(c.high));
  if (valid.length < 5) return null;

  const currentPrice = valid[valid.length - 1].close;
  const startPrice = valid[0].close;
  const change = ((currentPrice - startPrice) / startPrice) * 100;

  const rsi = calculateRSI(valid);
  let minPrice = currentPrice, maxPrice = currentPrice;
  for (const c of valid) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  }
  const range = maxPrice - minPrice || 1;
  const supportProximity = (maxPrice - currentPrice) / range;

  const count = Math.min(20, valid.length);
  const sma20 = valid.slice(-count).reduce((s: number, c: any) => s + c.close, 0) / count;

  let rsiScore = 50;
  if (rsi < 30) rsiScore = 95;
  else if (rsi < 45) rsiScore = 80;
  else if (rsi < 60) rsiScore = 60;
  else if (rsi < 70) rsiScore = 35;
  else rsiScore = 15;

  const supportScore = Math.min(supportProximity * 100, 100);
  const trendScore = currentPrice > sma20 ? 80 : 35;

  const score = Math.round(rsiScore * 0.4 + supportScore * 0.3 + trendScore * 0.3);

  let reasoning = "";
  if (score >= 75) reasoning = `Excellent buy opportunity. RSI is oversold at ${rsi.toFixed(0)}, near strong support at ₹${minPrice.toFixed(2)}.`;
  else if (score >= 60) reasoning = `Solid upward momentum, trading above 20-day average of ₹${sma20.toFixed(2)}.`;
  else if (score >= 45) reasoning = `Moving sideways in neutral range between ₹${minPrice.toFixed(2)} and ₹${maxPrice.toFixed(2)}.`;
  else reasoning = `Overbought with RSI at ${rsi.toFixed(0)}. High pullback risk near resistance ₹${maxPrice.toFixed(2)}.`;

  return {
    score: Math.max(0, Math.min(100, score)),
    change: +change.toFixed(2),
    rsi: +rsi.toFixed(1),
    reasoning,
    support: +minPrice.toFixed(2),
    resistance: +maxPrice.toFixed(2),
    stopLoss: +(minPrice * 0.96).toFixed(2),
    target: +(maxPrice * 1.05).toFixed(2),
    aboveSMA20: currentPrice > sma20,
    currentPrice: +currentPrice.toFixed(2),
  };
}

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
