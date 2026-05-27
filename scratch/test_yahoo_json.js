const yahooSymbol = "RELIANCE.NS";
const pageUrl = `https://finance.yahoo.com/quote/${yahooSymbol}`;

async function test() {
  console.log(`Testing Yahoo JSON Extraction for ${yahooSymbol}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  
  try {
    const res = await fetch(pageUrl, { headers });
    const html = await res.text();
    
    const jsonMatch = html.match(/root\.App\.main\s*=\s*(\{.*?\});\s*<\/script>/) 
                   || html.match(/window\.App\.main\s*=\s*(\{.*?\});/);
                   
    if (jsonMatch) {
       console.log("Success! Found JSON block.");
       const fullState = JSON.parse(jsonMatch[1]);
       const stores = fullState.context?.dispatcher?.stores;
       const quoteStore = stores?.QuoteSummaryStore;
       console.log("Market Cap:", quoteStore?.price?.marketCap?.fmt);
       console.log("PE Ratio:", quoteStore?.summaryDetail?.trailingPE?.fmt);
    } else {
       console.log("Failed to find JSON block.");
       // Log first 1000 chars to see what we got
       console.log("HTML Preview:", html.substring(0, 500));
    }
  } catch (e) {
    console.log("Fetch failed:", e);
  }
}

test();
