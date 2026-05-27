import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[Cleanup] Starting cleanup of foreign stocks...');
    
    // Delete all watchlist stocks that do not end with :NSE
    const watchlistDeleted = await prisma.watchlistStock.deleteMany({
      where: {
        NOT: {
          symbol: {
            endsWith: ':NSE'
          }
        }
      }
    });
    console.log(`[Cleanup] Deleted ${watchlistDeleted.count} foreign stocks from Watchlists.`);

    // Delete all scanned stocks that do not end with :NSE
    const scannedDeleted = await prisma.scannedStock.deleteMany({
      where: {
        NOT: {
          symbol: {
            endsWith: ':NSE'
          }
        }
      }
    });
    console.log(`[Cleanup] Deleted ${scannedDeleted.count} foreign stocks from Scanned Stocks.`);

    console.log('[Cleanup] Database successfully sanitized!');
  } catch (err) {
    console.error('[Cleanup] Error occurred:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
