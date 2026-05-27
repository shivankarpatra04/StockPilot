const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUnionBank() {
  try {
    const stocks = await prisma.scannedStock.findMany();
    console.log("Total stocks in scanned_stocks:", stocks.length);

    const ub = stocks.find(s => s.symbol.includes("UNIONBANK"));
    if (!ub) {
      console.log("UNIONBANK not found in scanned_stocks table!");
      return;
    }

    console.log("UNIONBANK found in scanned_stocks:", ub.symbol, "| Price:", ub.price);
    console.log("UNIONBANK analysisData:", JSON.stringify(ub.analysisData, null, 2));

    // Let's simulate how opportunities/route.ts maps UNIONBANK across all timeframes (1, 7, 15, 30, 60, 90)
    const timeframes = ["1", "7", "15", "30", "60", "90"];
    timeframes.forEach(days => {
      const a = ub.analysisData?.[days];
      if (!a) {
        console.log(`Timeframe ${days}: No analysis data`);
        return;
      }

      const hash = ub.symbol.split(":")[0].split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const expiryDays = (hash % 85) + 3;

      const isLong = a.score >= 50;
      const confidence = isLong ? a.score : 100 - a.score;
      const passSwingFilter = a.score >= 65 || a.score <= 35 || a.rsi > 70;

      console.log(`Timeframe ${days}:`, {
        score: a.score,
        rsi: a.rsi,
        isLong,
        confidence,
        expiryDays,
        passSwingFilter,
        showInSwingOpportunities: passSwingFilter && expiryDays <= parseInt(days) && confidence >= 70
      });
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnionBank();
