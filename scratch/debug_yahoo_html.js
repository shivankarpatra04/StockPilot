const symbol = "RELIANCE.NS";
const url = `https://finance.yahoo.com/quote/${symbol}/`;

async function test() {
  console.log(`Fetching ${url}...`);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    const res = await fetch(url, { headers });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    
    console.log("HTML length:", html.length);
    
    const mkCapMatch = html.match(/"marketCap":\s*\{\s*"raw":\s*([\d.eE+]+)/);
    console.log("Market Cap Match:", mkCapMatch ? mkCapMatch[0] : "Not found");
    
    const peMatch = html.match(/"trailingPE":\s*\{\s*"raw":\s*([\d.eE+]+)/);
    console.log("PE Match:", peMatch ? peMatch[0] : "Not found");

    const revMatch = html.match(/"revenueGrowth":\s*\{\s*"raw":\s*([\d.eE+.-]+)/);
    console.log("Rev Growth Match:", revMatch ? revMatch[0] : "Not found");

    // Look for any script tags that might contain data
    const scriptTags = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/g);
    console.log("Number of script tags:", scriptTags ? scriptTags.length : 0);
    
    if (scriptTags && scriptTags[54]) {
        console.log("Script tag 54 start:");
        console.log(scriptTags[54].substring(0, 1000));
    }

  } catch (e) {
    console.error("Error:", e);
  }
}

test();
