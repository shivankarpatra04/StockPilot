const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const stocks = await prisma.scannedStock.findMany({
      select: { symbol: true, analysisData: true }
    });

    console.log("Total scanned stocks in DB:", stocks.length);
    if (stocks.length === 0) {
      console.log("No stocks in scanned_stocks table!");
      return;
    }

    let maxScore = -1;
    let count90Plus = 0;
    
    stocks.forEach(s => {
      const data = s.analysisData;
      if (data) {
        Object.keys(data).forEach(days => {
          const score = data[days]?.score;
          if (score !== undefined) {
            if (score > maxScore) maxScore = score;
            if (score >= 90) count90Plus++;
          }
        });
      }
    });

    console.log("Maximum Buy Score found in DB:", maxScore);
    console.log("Total scores >= 90 in DB across all timeframes:", count90Plus);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
