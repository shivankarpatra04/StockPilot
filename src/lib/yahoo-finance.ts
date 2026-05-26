import type { StockQuote } from "@/types";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

/**
 * Custom Yahoo Finance fetcher using yahoo-finance2 to avoid headers overflow
 * and handle crumb/cookie management automatically.
 */
export async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
  // Yahoo Finance uses .NS for NSE and .BO for BSE
  let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");
  
  try {
    const result = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData']
    });

    if (!result || !result.price) {
      return null;
    }

    const price: any = result.price;
    const summary: any = result.summaryDetail || {};
    const stats: any = result.defaultKeyStatistics || {};
    const financials: any = result.financialData || {};

    const regularMarketPrice = price.regularMarketPrice || price.regularMarketPreviousClose || 0;
    const previousClose = summary.previousClose || price.regularMarketPreviousClose || regularMarketPrice;
    const change = regularMarketPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    
    const volume = summary.volume || price.regularMarketVolume || 0;

    let marketCap = summary.marketCap || price.marketCap || null;
    let trailingPE = summary.trailingPE || stats.trailingPE || null;
    let fiftyTwoWeekHigh = summary.fiftyTwoWeekHigh || price.fiftyTwoWeekHigh || 0;
    let fiftyTwoWeekLow = summary.fiftyTwoWeekLow || price.fiftyTwoWeekLow || 0;
    let revenueGrowth = financials.revenueGrowth || null;

    return {
      symbol: symbol,
      shortName: price.shortName || symbol,
      longName: price.longName || symbol,
      regularMarketPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: volume,
      averageVolume: summary.averageVolume || 0,
      marketCap,
      trailingPE,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      fiftyDayAverage: summary.fiftyDayAverage || null,
      twoHundredDayAverage: summary.twoHundredDayAverage || null,
      revenueGrowth,
      currency: price.currency || "USD",
    };
  } catch (err) {
    console.error(`[YahooFinance] Error for ${symbol}:`, err);
    return null;
  }
}

/**
 * Fetch latest news for a given stock symbol
 */
export async function fetchStockNews(symbol: string) {
  let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");
  const cleanSymbol = symbol.split(":")[0];
  
  try {
    // Try symbol search first
    let result = await yahooFinance.search(yahooSymbol);
    let news = result.news || [];

    // If we have very few news items or they look like general market news,
    // try searching by company name too
    if (news.length < 3) {
      const quote = await yahooFinance.quote(yahooSymbol);
      const companyName = quote.longName || quote.shortName || cleanSymbol;
      const result2 = await yahooFinance.search(companyName);
      if (result2.news) {
        // Merge and de-duplicate
        const existingTitles = new Set(news.map(n => n.title));
        result2.news.forEach((n: any) => {
          if (!existingTitles.has(n.title)) {
            news.push(n);
          }
        });
      }
    }

    // Filter news to ensure it's at least somewhat related to the ticker or sector
    // For now, we'll keep it simple: if it's from search(symbol), it's likely intended for that symbol
    // but Yahoo's search is broad. We can do a basic keyword check.
    const filteredNews = news.filter((n: any) => {
      const title = n.title.toLowerCase();
      const companyPart = cleanSymbol.toLowerCase();
      // Relaxed check: if it's a search result for the ticker, it's often relevant
      // but if it's too general (like "Brent hovers around $100"), we might want to skip it
      // However, without a sophisticated NLP, we'll just take the top 5.
      return true; 
    });

    return filteredNews.slice(0, 5).map((n: any) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      providerPublishTime: n.providerPublishTime,
    }));
  } catch (err) {
    console.error(`[YahooFinance] Error fetching news for ${symbol}:`, err);
    return [];
  }
}

/**
 * Fetch latest historical candles (OHLCV) for a given stock symbol
 */
export async function fetchStockCandles(symbol: string, days: number = 30) {
  let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");
  
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - days * 2); // get extra days to account for weekends/holidays
    
    const result = await yahooFinance.chart(yahooSymbol, {
      period1: period1.toISOString().split("T")[0],
      interval: "1d",
    });

    if (!result || !result.quotes) {
      return [];
    }

    // Return the last `days` candles
    const candles = result.quotes.slice(-days).map((r: any) => ({
      date: r.date.toISOString(),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    }));

    return candles;
  } catch (err) {
    console.error(`[YahooFinance] Error fetching candles for ${symbol}:`, err);
    return [];
  }
}
