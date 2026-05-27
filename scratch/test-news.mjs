import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

async function test() {
  const symbol = "TCS.NS";
  console.log(`Searching news for ${symbol}...`);
  try {
    const result = await yahooFinance.search(symbol);
    console.log("News results count:", result.news?.length);
    if (result.news) {
      result.news.forEach((n, i) => {
        console.log(`${i+1}. ${n.title} (${n.publisher})`);
      });
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
