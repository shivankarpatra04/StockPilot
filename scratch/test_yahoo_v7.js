const symbols = "RELIANCE.NS,HDFCBANK.NS,AAPL";
const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

async function test() {
  console.log(`Testing Yahoo Quote v7 for ${symbols}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();
