import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- WATCHLIST STOCKS ---');
    const watchlistStocks = await prisma.watchlistStock.findMany({
      include: {
        watchlist: {
          select: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    });
    console.log(`Found ${watchlistStocks.length} total stocks in watchlists:`);
    watchlistStocks.forEach(s => {
      console.log(`- Symbol: ${s.symbol} | User: ${s.watchlist?.user?.email} | Watchlist ID: ${s.watchlistId}`);
    });

    console.log('\n--- SCANNED STOCKS ---');
    const scannedStocks = await prisma.scannedStock.findMany({
      select: { symbol: true, shortName: true }
    });
    console.log(`Found ${scannedStocks.length} scanned stocks:`);
    scannedStocks.forEach(s => {
      console.log(`- Symbol: ${s.symbol} | Name: ${s.shortName}`);
    });

  } catch (err) {
    console.error('Error running check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
