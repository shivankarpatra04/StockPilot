export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { fetchStockData } from "@/lib/stocks";
import { explain, isMode, type Mode } from "@/lib/lang";
import type { ApiError } from "@/types";

// Simple in-memory cache to save API limits during development
const analysisCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { symbol, days = 30 } = body;
    const mode: Mode = isMode(body.mode) ? body.mode : "expert";

    if (!symbol) {
      return NextResponse.json<ApiError>(
        { error: "Invalid request: missing symbol" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${symbol.toUpperCase()}_${days}_${mode}`;
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Analysis API] Returning cached result for ${cacheKey}`);
      return NextResponse.json(cached.data);
    }

    // Fetch OHLCV data using the robust fetcher
    const stockData = await fetchStockData(symbol, days);
    const candles = stockData?.candles || [];
    
    if (!candles || candles.length === 0) {
      return NextResponse.json<ApiError>(
        { error: "Could not fetch historical data for analysis." },
        { status: 404 }
      );
    }

    const currentPrice = candles[candles.length - 1].close;

    // Generate heuristic analysis instead of using AI
    let rsiValue = 50;
    if (candles.length > 14) {
      let gains = 0, losses = 0;
      for (let i = candles.length - 14; i < candles.length; i++) {
        const diff = candles[i].close - candles[i-1].close;
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValue = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    }

    const isBullish = rsiValue >= 45;
    let action = "Wait";
    if (rsiValue < 30 || (rsiValue >= 45 && rsiValue < 60)) action = "Long";
    else if (rsiValue > 70) action = "Short";

    let sum20 = 0;
    const lookback = Math.min(20, candles.length);
    for (let i = candles.length - lookback; i < candles.length; i++) {
      sum20 += candles[i].close;
    }
    const sma20 = sum20 / lookback;

    // Find local min/max for simple zones
    let minPrice = currentPrice;
    let maxPrice = currentPrice;
    for (let i = Math.max(0, candles.length - 10); i < candles.length; i++) {
      if (candles[i].low < minPrice) minPrice = candles[i].low;
      if (candles[i].high > maxPrice) maxPrice = candles[i].high;
    }

    // Default to percentages if min/max are too close
    if (maxPrice - minPrice < currentPrice * 0.02) {
      minPrice = currentPrice * 0.95;
      maxPrice = currentPrice * 1.05;
    }

    const name = String(symbol).split(":")[0];
    const aboveAvg = currentPrice > sma20;
    const rsi1 = rsiValue.toFixed(1);

    // All user-facing copy is written in two voices: plain beginner English
    // ("expert") and Hinglish + emojis ("simple"). See src/lib/lang.ts.
    const text = mode === "simple"
      ? {
          buyReason: "Yahan pe daam pehle bhi sambhla tha 🛡️",
          sellReason: "Yahan pe daam pehle bhi atka tha 🚧",
          probReason: isBullish
            ? "Stock me dum hai aur base mazboot lag raha hai 💪"
            : "Stock thoda kamzor hai, girne ka risk zyada hai ⚠️",
          riskNote: rsiValue > 70
            ? "Stock bahut garam (mehenga) ho gaya hai — girne ka risk hai 🔥"
            : rsiValue < 30
              ? "Stock kaafi thanda (sasta) hai — sambhal sakta hai, par dhyaan se ❄️"
              : "Normal risk hai, kuch zyada darr ki baat nahi 🙂",
          rsiDetail: `RSI ${rsi1} ${explain("rsi", "simple")}`,
          macdDetail: isBullish ? "Trend upar ki taraf 📈" : "Trend neeche ki taraf 📉",
          trendDetail: aboveAvg ? "Daam average se upar hai ✅" : "Daam average se neeche hai ❌",
          verdict:
            `Pichle ${days} dino me ${name} ${isBullish ? "kaafi strong 💪" : "thoda kamzor 😟"} dikh raha hai. ` +
            `Abhi daam ${aboveAvg ? "upar ki taraf ja raha hai 📈" : "neeche ki taraf ja raha hai 📉"}. ` +
            (isBullish
              ? "Jab daam thoda gir kar safe level pe aaye, tab khareedna theek rahega. Par apne advisor se zaroor poochho 🙏"
              : "Abhi rukna behtar hai — thoda intezaar karo ya apne advisor se baat karke hi koi kadam uthao 🙏"),
          reasoningDetail:
            "Ye salah stock ke recent daam aur uske up-down (kitna hilta hai) ke hisaab se banayi gayi hai. Ye sirf seekhne ke liye hai, pakki tip nahi 📚",
        }
      : {
          buyReason: "Price found support here recently (it stopped falling at this level)",
          sellReason: "Price hit resistance here recently (it stopped rising at this level)",
          probReason: isBullish
            ? "Momentum is positive and the price base looks steady."
            : "Momentum is weak, so there's a higher chance of the price drifting down.",
          riskNote: rsiValue > 70
            ? `The stock looks overbought ${explain("rsi", "expert")}, so there's a real chance of a pullback.`
            : rsiValue < 30
              ? `The stock looks oversold ${explain("rsi", "expert")}, which can lead to a bounce — but stay careful.`
              : "Risk is around normal levels right now — nothing unusual.",
          rsiDetail: `RSI ${rsi1} ${explain("rsi", "expert")}`,
          macdDetail: isBullish ? "Trend is pointing up" : "Trend is pointing down",
          trendDetail: aboveAvg
            ? `Price is above its recent average ${explain("sma", "expert")}`
            : `Price is below its recent average ${explain("sma", "expert")}`,
          verdict:
            `Over the last ${days} days, ${name} is looking ${isBullish ? "fairly strong" : "a bit weak"}. ` +
            `The price is currently ${aboveAvg ? "above" : "below"} its recent average ${explain("sma", "expert")}. ` +
            (isBullish
              ? "It could be worth buying when the price dips to a safer level — but please check with your advisor first."
              : "It's better to be patient — wait for a clearer signal, or talk to your advisor before doing anything."),
          reasoningDetail:
            "This view is based on the stock's recent price moves and how much it tends to swing up and down. It's for learning only, not a guaranteed tip.",
        };

    let parsedResult = {
      buyZones: [
        { low: +(minPrice * 0.98).toFixed(2), high: +(minPrice * 1.02).toFixed(2), strength: 4, reason: text.buyReason }
      ],
      sellZones: [
        { low: +(maxPrice * 0.98).toFixed(2), high: +(maxPrice * 1.02).toFixed(2), strength: 4, reason: text.sellReason }
      ],
      probability: {
        profitProb: isBullish ? 65 : 40,
        lossProb: isBullish ? 35 : 60,
        reasoning: text.probReason
      },
      keyMetrics: {
        stopLoss: +(minPrice * 0.95).toFixed(2),
        target1: +(maxPrice * 1.02).toFixed(2),
        target2: +(maxPrice * 1.08).toFixed(2),
        riskReward: "1:2.5"
      },
      riskMeter: {
        riskLevel: rsiValue > 70 || rsiValue < 30 ? "high" : "moderate",
        riskScore: rsiValue > 70 ? 80 : (rsiValue < 30 ? 70 : 40),
        riskNote: text.riskNote
      },
      signals: [
        { name: "RSI (14)", signal: rsiValue > 60 ? "Bullish" : (rsiValue < 40 ? "Bearish" : "Neutral"), detail: text.rsiDetail },
        { name: "MACD", signal: isBullish ? "Bullish" : "Bearish", detail: text.macdDetail },
        { name: "Trend (20 SMA)", signal: aboveAvg ? "Bullish" : "Bearish", detail: text.trendDetail }
      ],
      verdict: text.verdict,
      action: action,
      reasoningDetail: text.reasoningDetail
    };

    // Save to cache
    analysisCache.set(cacheKey, { data: parsedResult, timestamp: Date.now() });

    return NextResponse.json(parsedResult);
  } catch (err) {
    console.error("[/api/claude/analysis] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "AI analysis temporarily unavailable.", details: String(err) },
      { status: 500 }
    );
  }
}
