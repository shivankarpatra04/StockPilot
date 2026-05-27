const yahooSymbol = "RELIANCE.NS";
const statsUrl = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${yahooSymbol}?modules=defaultKeyStatistics,summaryDetail,price,financialData`;

async function test() {
  console.log(`Testing Yahoo Stats for ${yahooSymbol}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  const res = await fetch(statsUrl, { headers });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();
