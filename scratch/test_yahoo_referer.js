const yahooSymbol = "RELIANCE.NS";
const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryDetail,defaultKeyStatistics,financialData,price`;

async function test() {
  console.log(`Testing Yahoo Stats v10 for ${yahooSymbol} with full headers...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Origin": "https://finance.yahoo.com",
    "Referer": `https://finance.yahoo.com/quote/${yahooSymbol}`,
  };
  
  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (data.finance?.error) {
       console.log("Error:", data.finance.error);
    } else {
       console.log("Success! Market Cap:", data.quoteSummary?.result?.[0]?.summaryDetail?.marketCap?.fmt);
    }
  } catch (e) {
    console.log("Fetch failed:", e);
  }
}

test();
