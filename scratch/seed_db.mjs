import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function seedMockSignals() {
  console.log("Starting trading signals seed...");
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
      triggerText = `Retest of key daily support at ₹${stopLoss} verified with heavy volume accumulation. Favorable risk-to-reward.`;
    } else if (type === "BREAKOUT") {
      triggerText = `Cleared major multi-week resistance level. RSI is supportive at ${Math.floor(Math.random()*15)+50} without overbought reading.`;
    } else if (type === "CATCHUP") {
      triggerText = `${stock.name} is consolidating under key moving averages while the rest of ${stock.sector} sector is up over ${Math.floor(Math.random()*4)+4}%. Primed to run.`;
    } else {
      triggerText = `Positive options flow and accumulation spotted in anticipation of earnings announcement in ${Math.floor(Math.random()*4)+2} days.`;
    }

    const status = statuses[i % statuses.length];
    let resolvedAt = null;
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
  
  console.log(`Seeded ${signalsToCreate.length} signals successfully!`);
}

async function run() {
  try {
    await seedMockSignals();
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
