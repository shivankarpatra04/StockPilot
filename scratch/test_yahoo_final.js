const symbol = "RELIANCE:NSE";
let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");

const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

async function test() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    const pageUrl = `https://finance.yahoo.com/quote/${yahooSymbol}`;
    console.log(`Fetching ${pageUrl}...`);
    const pageRes = await fetch(pageUrl, { headers });
    
    if (pageRes.ok) {
      const html = await pageRes.text();
      
      let marketCap = null;
      let trailingPE = null;
      let revenueGrowth = null;

      const mkCapMatch = html.match(/(?:"|\\")marketCap(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
      if (mkCapMatch) marketCap = parseFloat(mkCapMatch[1]);
      
      const peMatch = html.match(/(?:"|\\")trailingPE(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
      if (peMatch) trailingPE = parseFloat(peMatch[1]);
      
      const revMatch = html.match(/(?:"|\\")revenueGrowth(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+.-]+)/);
      if (revMatch) revenueGrowth = parseFloat(revMatch[1]);

      console.log("Results:");
      console.log("Market Cap:", marketCap);
      console.log("Trailing PE:", trailingPE);
      console.log("Revenue Growth:", revenueGrowth);
    } else {
      console.log("Page fetch failed:", pageRes.status);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
