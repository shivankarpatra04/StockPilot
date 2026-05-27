const yahooSymbol = "RELIANCE.NS";
const statsUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=defaultKeyStatistics,summaryDetail,price,financialData`;

async function test() {
  console.log(`Testing Yahoo Stats v10 for ${yahooSymbol}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
  };
  const res = await fetch(statsUrl, { headers });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();
