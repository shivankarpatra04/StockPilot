import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

async function test(query) {
  console.log(`Searching for "${query}"...`);
  try {
    const result = await yahooFinance.search(query);
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
    await test("TCS.NS");
    console.log("---");
    await test("Tata Consultancy Services");
    console.log("---");
    await test("TCS Stock News");
}

run();
