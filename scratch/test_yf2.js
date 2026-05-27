const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function testChart() {
  const symbol = "RELIANCE.NS";
  console.log(`Testing yahoo-finance2 for ${symbol}...`);
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 60);
    
    const result = await yahooFinance.chart(symbol, {
      period1: period1.toISOString().split("T")[0],
      interval: "1d",
    });
    
    if (result && result.quotes) {
      console.log(`Successfully fetched ${result.quotes.length} candles.`);
      console.log(`Last candle: ${JSON.stringify(result.quotes[result.quotes.length-1])}`);
    } else {
      console.log("No quotes found.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testChart();
