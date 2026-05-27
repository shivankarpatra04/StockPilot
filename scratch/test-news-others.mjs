import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

async function test(symbol) {
  console.log(`Searching news for ${symbol}...`);
  try {
    const result = await yahooFinance.search(symbol);
    console.log("News results count:", result.news?.length);
    if (result.news) {
      result.news.slice(0, 5).forEach((n, i) => {
        console.log(`${i+1}. ${n.title} (${n.publisher})`);
      });
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function run() {
    await test("RELIANCE.NS");
    console.log("---");
    await test("AAPL");
}

run();
