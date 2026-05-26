export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStockData } from "@/lib/stocks";
import { STOCK_UNIVERSE } from "@/lib/nifty500";

const MOCK_STOCKS = [
  { symbol: "RELIANCE:NSE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS:NSE", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "INFY:NSE", name: "Infosys Ltd.", sector: "IT" },
  { symbol: "HDFCBANK:NSE", name: "HDFC Bank Ltd.", sector: "Financial Services" },
  { symbol: "ICICIBANK:NSE", name: "ICICI Bank Ltd.", sector: "Financial Services" },
  { symbol: "SBIN:NSE", name: "State Bank of India", sector: "Financial Services" },
  { symbol: "AXISBANK:NSE", name: "Axis Bank Ltd.", sector: "Financial Services" },
  { symbol: "LT:NSE", name: "Larsen & Toubro Ltd.", sector: "Construction" },
  { symbol: "ITC:NSE", name: "ITC Ltd.", sector: "FMCG" },
  { symbol: "BHARTIARTL:NSE", name: "Bharti Airtel Ltd.", sector: "Telecommunication" },
  { symbol: "M&M:NSE", name: "Mahindra & Mahindra", sector: "Automobile" },
  { symbol: "TATAMOTORS:NSE", name: "Tata Motors Ltd.", sector: "Automobile" },
  { symbol: "SUNPHARMA:NSE", name: "Sun Pharmaceutical", sector: "Healthcare" },
  { symbol: "TITAN:NSE", name: "Titan Company Ltd.", sector: "Consumer Durables" },
  { symbol: "ULTRACEMCO:NSE", name: "UltraTech Cement", sector: "Materials" },
];

export async function GET() {
  try {
    // 1. Check if we need to seed mock signals
    const count = await prisma.tradingSignal.count();
    if (count < 15) {
      await seedMockSignals();
    }

    // 2. Validate all ACTIVE signals
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

// Help create seed data with realistic historical setups over the past 30 days
async function seedMockSignals() {
  console.log("[SEED] Seeding historical trading signals...");
  const signalsToCreate = [];

  const types = ["SWING", "BREAKOUT", "CATCHUP", "EARNINGS"];
  const statuses = ["SUCCESSFUL", "SUCCESSFUL", "SUCCESSFUL", "UNSUCCESSFUL", "SUCCESSFUL", "EXPIRED"];

  const now = new Date();

  // Create ~50 historical resolved signals
  for (let i = 0; i < 45; i++) {
    const stock = MOCK_STOCKS[i % MOCK_STOCKS.length];
    const type = types[i % types.length];
    
    // Setup date between 30 days ago and 5 days ago
    const creationDaysAgo = Math.floor(Math.random() * 25) + 6;
    const createdAt = new Date();
    createdAt.setDate(now.getDate() - creationDaysAgo);
    
    const expiryDays = Math.floor(Math.random() * 15) + 3;
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(createdAt.getDate() + expiryDays);

    const direction = Math.random() > 0.35 ? "LONG" : "SHORT";
    
    // Pick standard base price
    const entryPrice = Math.floor(Math.random() * 2000) + 150;
    let targetPrice = 0;
    let stopLoss = 0;

    if (direction === "LONG") {
      targetPrice = +(entryPrice * (1 + (Math.random() * 0.08 + 0.04))).toFixed(2); // 4% to 12% target
      stopLoss = +(entryPrice * (1 - (Math.random() * 0.03 + 0.02))).toFixed(2); // 2% to 5% stoploss
    } else {
      targetPrice = +(entryPrice * (1 - (Math.random() * 0.08 + 0.04))).toFixed(2);
      stopLoss = +(entryPrice * (1 + (Math.random() * 0.03 + 0.02))).toFixed(2);
    }

    const rrRatio = (Math.abs(targetPrice - entryPrice) / Math.abs(entryPrice - stopLoss)).toFixed(1);
    const confidence = Math.floor(Math.random() * 30) + 65; // 65 to 95

    let triggerText = "";
    if (type === "SWING") {
      triggerText = `Retest of key daily support at â‚¹${stopLoss} verified with heavy volume accumulation. Favorable risk-to-reward.`;
    } else if (type === "BREAKOUT") {
      triggerText = `Cleared major multi-week resistance level. RSI is supportive at ${Math.floor(Math.random()*15)+50} without overbought reading.`;
    } else if (type === "CATCHUP") {
      triggerText = `${stock.name} is consolidating under key moving averages while the rest of ${stock.sector} sector is up over ${Math.floor(Math.random()*4)+4}%. Primed to run.`;
    } else {
      triggerText = `Positive options flow and accumulation spotted in anticipation of earnings announcement in ${Math.floor(Math.random()*4)+2} days.`;
    }

    const status = statuses[i % statuses.length];
    let resolvedAt: Date | null = null;
    let returnPct = 0;
    let peakPrice = entryPrice;

    if (status === "SUCCESSFUL") {
      const resolutionDays = Math.floor(Math.random() * (expiryDays - 1)) + 1;
      resolvedAt = new Date(createdAt);
      resolvedAt.setDate(createdAt.getDate() + resolutionDays);
      returnPct = direction === "LONG" 
        ? ((targetPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - targetPrice) / entryPrice) * 100;
      peakPrice = direction === "LONG" ? targetPrice * 1.01 : targetPrice * 0.99;
    } else if (status === "UNSUCCESSFUL") {
      const resolutionDays = Math.floor(Math.random() * (expiryDays - 1)) + 1;
      resolvedAt = new Date(createdAt);
      resolvedAt.setDate(createdAt.getDate() + resolutionDays);
      returnPct = direction === "LONG"
        ? ((stopLoss - entryPrice) / entryPrice) * 100
        : ((entryPrice - stopLoss) / entryPrice) * 100;
      peakPrice = direction === "LONG" ? entryPrice * 1.01 : entryPrice * 0.99;
    } else { // EXPIRED
      resolvedAt = expiryDate;
      const rndReturn = (Math.random() * 4 - 2); // -2% to +2%
      returnPct = rndReturn;
      peakPrice = direction === "LONG" 
        ? entryPrice * (1 + Math.random() * 0.03) 
        : entryPrice * (1 - Math.random() * 0.03);
    }

    signalsToCreate.push({
      symbol: stock.symbol,
      name: stock.name,
      type,
      direction,
      entryPrice,
      stopLoss,
      targetPrice,
      confidence,
      triggerText,
      status,
      createdAt,
      expiryDate,
      resolvedAt,
      peakPrice: +peakPrice.toFixed(2),
      returnPct: +returnPct.toFixed(2),
    });
  }

  // Create ~8 ACTIVE signals for the live view
  for (let i = 0; i < 8; i++) {
    const stock = MOCK_STOCKS[(i + 4) % MOCK_STOCKS.length];
    const type = types[i % types.length];
    const direction = Math.random() > 0.4 ? "LONG" : "SHORT";
    
    const createdAt = new Date();
    createdAt.setDate(now.getDate() - (i % 3 + 1)); // 1-3 days ago
    
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(createdAt.getDate() + 7);

    const entryPrice = Math.floor(Math.random() * 1500) + 200;
    let targetPrice = 0;
    let stopLoss = 0;

    if (direction === "LONG") {
      targetPrice = +(entryPrice * 1.07).toFixed(2);
      stopLoss = +(entryPrice * 0.96).toFixed(2);
    } else {
      targetPrice = +(entryPrice * 0.93).toFixed(2);
      stopLoss = +(entryPrice * 1.04).toFixed(2);
    }

    const confidence = Math.floor(Math.random() * 20) + 75;

    let triggerText = "";
    if (type === "SWING") {
      triggerText = `Retest of 20-day exponential moving average. Volume expansion indicates institutional support.`;
    } else if (type === "BREAKOUT") {
      triggerText = `Ascending triangle breakout confirmed on high relative volume. Ready for technical continuation.`;
    } else if (type === "CATCHUP") {
      triggerText = `Major sector rotation starting in ${stock.sector}. ${stock.name} has not moved yet and is coiled tightly.`;
    } else {
      triggerText = `Recent earnings beat combined with positive post-earnings analyst upgrades acting as momentum catalyst.`;
    }

    signalsToCreate.push({
      symbol: stock.symbol,
      name: stock.name,
      type,
      direction,
      entryPrice,
      stopLoss,
      targetPrice,
      confidence,
      triggerText,
      status: "ACTIVE",
      createdAt,
      expiryDate,
      resolvedAt: null,
      peakPrice: entryPrice,
      returnPct: null,
    });
  }

  await prisma.tradingSignal.createMany({
    data: signalsToCreate
  });
  console.log(`[SEED] Finished seeding ${signalsToCreate.length} mock signals.`);
}
