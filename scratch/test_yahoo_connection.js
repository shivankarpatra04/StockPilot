const symbol = "RELIANCE:NSE";
const [ticker, exchange] = symbol.split(":");
const yfSymbol = `${ticker}.${exchange === "NSE" ? "NS" : "BO"}`;
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?range=30d&interval=1d`;

async function testYahoo() {
  console.log(`Testing Yahoo Finance for ${yfSymbol}...`);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com"
      }
    });
    
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      const result = data.chart.result[0];
      console.log(`Successfully fetched ${result.timestamp.length} candles.`);
    } else {
      console.log(`Error: ${await response.text()}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testYahoo();
