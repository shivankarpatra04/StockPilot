const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check90D() {
  try {
    const stocks = await prisma.scannedStock.findMany();
    const scored = stocks.map(s => {
      const a = s.analysisData?.["90"];
      if (!a) return null;
      return { ...s, analysis: a };
    }).filter(Boolean);

    const swingTrades = scored
      .filter(s => s.analysis.score >= 65 || s.analysis.score <= 35 || s.analysis.rsi > 70)
      .map(s => {
        const isLong = s.analysis.score >= 50;
        const entryMin = s.price * 0.99;
        const entryMax = s.price * 1.01;
        const stopLoss = isLong ? s.analysis.stopLoss : +(s.price * 1.04).toFixed(2);
        const target1 = isLong ? s.analysis.target : +(s.price * 0.95).toFixed(2);
        const target2 = isLong ? +(s.analysis.target * 1.05).toFixed(2) : +(s.price * 0.90).toFixed(2);
        
        const risk = Math.abs(s.price - stopLoss);
        const reward = Math.abs(target1 - s.price);
        const rrRatio = risk > 0 ? (reward / risk).toFixed(1) : "2.2";

        const hash = s.symbol.split(":")[0].split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const expiryDays = (hash % 85) + 3;

        return {
          symbol: s.symbol,
          name: s.shortName,
          direction: isLong ? "LONG" : "SHORT",
          expiryDays,
          entry: `₹${entryMin.toFixed(2)} – ₹${entryMax.toFixed(2)}`,
          stopLoss: `₹${stopLoss}`,
          target1: `₹${target1}`,
          target2: `₹${target2}`,
          riskReward: `1:${rrRatio}`,
          trigger: s.analysis.reasoning,
          confidence: isLong ? s.analysis.score : 100 - s.analysis.score
        };
      })
      .filter(trade => trade.expiryDays <= 90 && trade.confidence >= 70)
      .sort((a, b) => b.confidence - a.confidence);

    console.log("Total 90D swing setups found:", swingTrades.length);
    swingTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} | Confidence: ${trade.confidence}% | Expiry: ${trade.expiryDays} days`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check90D();
