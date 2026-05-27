const symbol = "RELIANCE:NSE";
let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");

async function test() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    const pageUrl = `https://finance.yahoo.com/quote/${yahooSymbol}/`;
    console.log(`Fetching ${pageUrl}...`);
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
      };
    const pageRes = await fetch(pageUrl, { headers });
    console.log("Response status:", pageRes.status);
    
    const html = await pageRes.text();
    
    let marketCap = null;
    let trailingPE = null;
    let revenueGrowth = null;

    const svelteScripts = html.match(/<script\b[^>]*data-sveltekit-fetched[^>]*>([\s\S]*?)<\/script>/g);
    if (svelteScripts) {
      console.log(`Found ${svelteScripts.length} SvelteKit scripts`);
      for (const script of svelteScripts) {
        if (script.includes("quoteSummary")) {
          console.log("Found quoteSummary script");
          try {
            const jsonContent = script.replace(/<script\b[^>]*>|<\/script>/g, '').trim();
            const wrapper = JSON.parse(jsonContent);
            const body = JSON.parse(wrapper.body);
            const result = body.quoteSummary?.result?.[0];
            
            if (result) {
              marketCap = result.price?.marketCap?.raw 
                        || result.summaryDetail?.marketCap?.raw 
                        || marketCap;
              trailingPE = result.summaryDetail?.trailingPE?.raw 
                         || result.defaultKeyStatistics?.trailingPE?.raw 
                         || trailingPE;
              revenueGrowth = result.financialData?.revenueGrowth?.raw || revenueGrowth;
              console.log("Extracted from SvelteKit JSON!");
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }
    }

    if (marketCap === null) {
        console.log("Falling back to regex...");
        const mkCapMatch = html.match(/(?:"|\\")marketCap(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
        if (mkCapMatch) marketCap = parseFloat(mkCapMatch[1]);
        
        const peMatch = html.match(/(?:"|\\")trailingPE(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+]+)/);
        if (peMatch) trailingPE = parseFloat(peMatch[1]);
        
        const revMatch = html.match(/(?:"|\\")revenueGrowth(?:"|\\"):\s*\{\s*(?:"|\\")raw(?:"|\\"):\s*([\d.eE+.-]+)/);
        if (revMatch) revenueGrowth = parseFloat(revMatch[1]);
    }

    console.log("Results:");
    console.log("Market Cap:", marketCap);
    console.log("Trailing PE:", trailingPE);
    console.log("Revenue Growth:", revenueGrowth);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
