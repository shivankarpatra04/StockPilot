import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    const total = await prisma.tradingSignal.count();
    console.log(`\n========================================`);
    console.log(`📢 VERIFICATION RESULTS`);
    console.log(`========================================`);
    console.log(`Total signals in database: ${total}`);
    
    if (total > 0) {
      const active = await prisma.tradingSignal.count({ where: { status: "ACTIVE" } });
      const successful = await prisma.tradingSignal.count({ where: { status: "SUCCESSFUL" } });
      const unsuccessful = await prisma.tradingSignal.count({ where: { status: "UNSUCCESSFUL" } });
      const expired = await prisma.tradingSignal.count({ where: { status: "EXPIRED" } });

      console.log(`- Active: ${active}`);
      console.log(`- Successful (Target Hit): ${successful}`);
      console.log(`- Stopped Out (Unsuccessful): ${unsuccessful}`);
      console.log(`- Expired: ${expired}`);
      
      const sample = await prisma.tradingSignal.findFirst({
        orderBy: { createdAt: "desc" }
      });
      console.log(`\nSample recent signal:`);
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log(`⚠️ Database signal table is empty.`);
    }
    console.log(`========================================\n`);
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
