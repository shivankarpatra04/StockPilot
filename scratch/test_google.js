const symbol = "RELIANCE:NSE";
const url = `https://www.google.com/finance/quote/${symbol}`;

async function test() {
  console.log(`Testing Google Finance for ${symbol}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  
  try {
    const res = await fetch(url, { headers });
    const html = await res.text();
    
    // Look for Market Cap
    const mkCapMatch = html.match(/Market cap[^<]*<[^>]*>([^<]+)/);
    const peMatch = html.match(/P\/E ratio[^<]*<[^>]*>([^<]+)/);
    
    console.log("Market Cap Match:", mkCapMatch ? mkCapMatch[1] : "Not found");
    console.log("PE Ratio Match:", peMatch ? peMatch[1] : "Not found");
    
    if (mkCapMatch || peMatch) {
       console.log("Success! Found data in Google Finance.");
    }
  } catch (e) {
    console.log("Fetch failed:", e);
  }
}

test();
