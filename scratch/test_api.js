const API_KEY = "0f04353b417848e78ff7e3fd88ae8529";
const symbol = "RELIANCE:NSE";

async function test() {
  console.log(`Testing ${symbol}...`);
  const res = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();
