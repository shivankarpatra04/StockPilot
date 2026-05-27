export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "ALL"; // ALL, SWING, BREAKOUT, etc.
    const status = searchParams.get("status") || "ALL"; // ALL, ACTIVE, SUCCESSFUL, UNSUCCESSFUL, EXPIRED
    const query = searchParams.get("query") || "";

    // 1. Fetch all signals to build overall analytics
    const allSignals = await prisma.tradingSignal.findMany({
      orderBy: { createdAt: "asc" }
    });

    if (allSignals.length === 0) {
      return NextResponse.json({
        stats: {
          total: 0,
          successful: 0,
          unsuccessful: 0,
          active: 0,
          expired: 0,
          winRate: 0,
          avgReturn: 0,
          currentStreak: 0,
          maxStreak: 0,
          avgDurationDays: 0,
        },
        chartData: [],
        strategyData: [],
        signals: []
      });
    }

    // 2. Compute aggregate analytics
    const resolved = allSignals.filter(s => s.status !== "ACTIVE");
    const active = allSignals.filter(s => s.status === "ACTIVE");
    const successful = resolved.filter(s => s.status === "SUCCESSFUL");
    const unsuccessful = resolved.filter(s => s.status === "UNSUCCESSFUL");
    const expired = resolved.filter(s => s.status === "EXPIRED");

    const totalResolved = successful.length + unsuccessful.length;
    const winRate = totalResolved > 0 ? (successful.length / totalResolved) * 100 : 0;
    const avgReturn = totalResolved > 0 
      ? resolved.reduce((sum, s) => sum + (s.returnPct || 0), 0) / resolved.length 
      : 0;

    // Calculate streaks chronologically
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Sort by resolution date to calculate streaks properly
    const resolvedChronological = [...resolved]
      .filter(s => s.resolvedAt)
      .sort((a, b) => new Date(a.resolvedAt!).getTime() - new Date(b.resolvedAt!).getTime());

    resolvedChronological.forEach(s => {
      if (s.status === "SUCCESSFUL") {
        tempStreak++;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      } else if (s.status === "UNSUCCESSFUL") {
        tempStreak = 0;
      }
    });
    
    // Current streak is based on the most recent resolved signals
    let currentTemp = 0;
    for (let i = resolvedChronological.length - 1; i >= 0; i--) {
      if (resolvedChronological[i].status === "SUCCESSFUL") {
        currentTemp++;
      } else if (resolvedChronological[i].status === "UNSUCCESSFUL") {
        break;
      }
    }
    currentStreak = currentTemp;

    // Average duration in days to hit target or stoploss
    let totalDurationMs = 0;
    let durationCount = 0;
    resolved.forEach(s => {
      if (s.resolvedAt) {
        totalDurationMs += new Date(s.resolvedAt).getTime() - new Date(s.createdAt).getTime();
        durationCount++;
      }
    });
    const avgDurationDays = durationCount > 0 
      ? +(totalDurationMs / (1000 * 60 * 60 * 24) / durationCount).toFixed(1)
      : 0;

    // 3. Create historical curve for Recharts (Cumulative Return Chart)
    // Starting with a base balance of ₹100,000, compounding or adding returnPct * 1000 (standard lot allocation)
    let runningBalance = 100000;
    const chartData = resolvedChronological.map(s => {
      const profitValue = (s.returnPct || 0) * 1000; // Simulated ₹1,000 per 1% return
      runningBalance += profitValue;
      return {
        date: new Date(s.resolvedAt!).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        symbol: s.symbol,
        returnPct: s.returnPct,
        profit: profitValue,
        balance: Math.round(runningBalance)
      };
    });

    // 4. Compute success rate per strategy/type
    const strategies = ["SWING", "BREAKOUT", "CATCHUP", "EARNINGS"];
    const strategyData = strategies.map(strat => {
      const stratSignals = resolved.filter(s => s.type === strat);
      const stratSuccess = stratSignals.filter(s => s.status === "SUCCESSFUL");
      const stratTotal = stratSignals.length;
      const rate = stratTotal > 0 ? (stratSuccess.length / stratTotal) * 100 : 0;
      return {
        name: strat === "SWING" ? "Swing Trades" 
            : strat === "BREAKOUT" ? "Breakouts" 
            : strat === "CATCHUP" ? "Sector Catch-Ups" 
            : "Earnings Plays",
        successRate: Math.round(rate),
        total: stratTotal
      };
    });

    // 5. Apply filters for the detailed Signals List response
    let filteredSignals = [...allSignals];

    if (type !== "ALL") {
      filteredSignals = filteredSignals.filter(s => s.type === type);
    }
    
    if (status !== "ALL") {
      filteredSignals = filteredSignals.filter(s => s.status === status);
    }

    if (query) {
      const q = query.toLowerCase();
      filteredSignals = filteredSignals.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q)
      );
    }

    // Sort: ACTIVE signals first, then by resolution/creation date descending
    filteredSignals.sort((a, b) => {
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      stats: {
        total: allSignals.length,
        successful: successful.length,
        unsuccessful: unsuccessful.length,
        active: active.length,
        expired: expired.length,
        winRate: +winRate.toFixed(1),
        avgReturn: +avgReturn.toFixed(2),
        currentStreak,
        maxStreak,
        avgDurationDays
      },
      chartData,
      strategyData,
      signals: filteredSignals
    });

  } catch (err) {
    console.error("[/api/track-record ERROR]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
