export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockData } from "@/lib/stocks";

export const maxDuration = 300; // fetches live candles per active signal; needs a long timeout (Vercel Pro)

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
    // Validate all ACTIVE signals against real price candles.
    const activeSignals = await prisma.tradingSignal.findMany({
      where: { status: "ACTIVE" }
    });

    let validatedCount = 0;
    let successfulCount = 0;
    let stoppedCount = 0;
    let expiredCount = 0;

    for (const signal of activeSignals) {
      const data = await fetchStockData(signal.symbol, 30);
      if (!data || !data.candles || data.candles.length === 0) continue;

      const candles = data.candles.filter((c: any) => new Date(c.time * 1000) >= new Date(signal.createdAt));
      if (candles.length === 0) continue;

      let hitTarget = false;
      let hitStop = false;
      let targetTime: Date | null = null;
      let stopTime: Date | null = null;
      let highestPrice = signal.entryPrice;
      let lowestPrice = signal.entryPrice;

      // Evaluate price path
      for (const candle of candles) {
        if (signal.direction === "LONG") {
          if (candle.high > highestPrice) highestPrice = candle.high;
          if (candle.low < lowestPrice) lowestPrice = candle.low;

          if (candle.low <= signal.stopLoss && !hitStop && !hitTarget) {
            hitStop = true;
            stopTime = new Date(candle.time * 1000);
          }
          if (candle.high >= signal.targetPrice && !hitTarget && !hitStop) {
            hitTarget = true;
            targetTime = new Date(candle.time * 1000);
          }
        } else { // SHORT
          if (candle.low < lowestPrice) lowestPrice = candle.low;
          if (candle.high > highestPrice) highestPrice = candle.high;

          if (candle.high >= signal.stopLoss && !hitStop && !hitTarget) {
            hitStop = true;
            stopTime = new Date(candle.time * 1000);
          }
          if (candle.low <= signal.targetPrice && !hitTarget && !hitStop) {
            hitTarget = true;
            targetTime = new Date(candle.time * 1000);
          }
        }
      }

      const now = new Date();
      const isExpired = now >= new Date(signal.expiryDate);
      const latestPrice = candles[candles.length - 1].close;

      if (hitTarget) {
        const returnPct = signal.direction === "LONG" 
          ? ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100
          : ((signal.entryPrice - signal.targetPrice) / signal.entryPrice) * 100;

        await prisma.tradingSignal.update({
          where: { id: signal.id },
          data: {
            status: "SUCCESSFUL",
            resolvedAt: targetTime || now,
            peakPrice: highestPrice,
            returnPct: +returnPct.toFixed(2),
            lastChecked: now
          }
        });
        successfulCount++;
        validatedCount++;
      } else if (hitStop) {
        const returnPct = signal.direction === "LONG"
          ? ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100
          : ((signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100;

        await prisma.tradingSignal.update({
          where: { id: signal.id },
          data: {
            status: "UNSUCCESSFUL",
            resolvedAt: stopTime || now,
            peakPrice: signal.direction === "LONG" ? highestPrice : lowestPrice,
            returnPct: +returnPct.toFixed(2),
            lastChecked: now
          }
        });
        stoppedCount++;
        validatedCount++;
      } else if (isExpired) {
        const returnPct = signal.direction === "LONG"
          ? ((latestPrice - signal.entryPrice) / signal.entryPrice) * 100
          : ((signal.entryPrice - latestPrice) / signal.entryPrice) * 100;

        await prisma.tradingSignal.update({
          where: { id: signal.id },
          data: {
            status: "EXPIRED",
            resolvedAt: new Date(signal.expiryDate),
            peakPrice: signal.direction === "LONG" ? highestPrice : lowestPrice,
            returnPct: +returnPct.toFixed(2),
            lastChecked: now
          }
        });
        expiredCount++;
        validatedCount++;
      } else {
        // Still active, just update peak price
        await prisma.tradingSignal.update({
          where: { id: signal.id },
          data: {
            peakPrice: signal.direction === "LONG" ? highestPrice : lowestPrice,
            lastChecked: now
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Validated active signals successfully.",
      summary: {
        totalChecked: activeSignals.length,
        resolvedSuccessful: successfulCount,
        resolvedStoppedOut: stoppedCount,
        resolvedExpired: expiredCount,
        stillActive: activeSignals.length - validatedCount
      }
    });

  } catch (err) {
    console.error("[validate-signals ERROR]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
