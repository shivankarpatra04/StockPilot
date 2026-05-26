import type { StockQuote } from "@/types";
import { fetchYahooQuote } from "./yahoo-finance";
import { STOCK_UNIVERSE } from "./nifty500";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  return fetchYahooQuote(symbol);
}

export async function fetchStockData(symbol: string, days: number = 30) {
  let yahooSymbol = symbol.replace(":NSE", ".NS").replace(":BSE", ".BO");
  
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - days * 2); // get extra days to account for weekends/holidays
    
    const result = await yahooFinance.chart(yahooSymbol, {
      period1: period1.toISOString().split("T")[0],
      interval: "1d",
    });

    if (result && result.quotes) {
      return {
        symbol,
        candles: result.quotes.map((r: any) => ({
          time: Math.floor(new Date(r.date).getTime() / 1000),
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
          volume: r.volume,
        })).filter((c: any) => c.close != null && !isNaN(c.close))
      };
    }
  } catch (err) {
    console.error(`[YahooFinance] fetchStockData failed for ${symbol}:`, err);
  }

  // Fallback to direct fetch if yahoo-finance2 chart fails
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${days}d&interval=1d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (result && result.timestamp) {
        const quotes = result.indicators.quote[0];
        
        return {
          symbol,
          candles: result.timestamp.map((t: number, i: number) => ({
            time: t,
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i]
          })).filter((c: any) => c.close != null && !isNaN(c.close))
        };
      }
    }
  } catch (err) {
    console.error(`Direct Yahoo Finance OHLCV failed for ${symbol}:`, err);
  }

  return null;
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<(StockQuote | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  return Promise.all(symbols.map((s) => fetchStockQuote(s)));
}

export async function fetchFiveDayReturn(symbol: string): Promise<number | null> {
  try {
    const data = await fetchStockData(symbol, 5);
    if (!data || !data.candles || data.candles.length < 2) return null;
    const currentPrice = data.candles[data.candles.length - 1].close;
    const fiveDaysAgoPrice = data.candles[0].close;
    if (isNaN(currentPrice) || isNaN(fiveDaysAgoPrice) || fiveDaysAgoPrice === 0) return null;
    return ((currentPrice - fiveDaysAgoPrice) / fiveDaysAgoPrice) * 100;
  } catch { return null; }
}

export async function searchSymbols(query: string) {
  if (!query) return [];
  const lowercaseQuery = query.toLowerCase();
  return STOCK_UNIVERSE.filter(
    (item) =>
      item.symbol.toLowerCase().includes(lowercaseQuery) ||
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.sector.toLowerCase().includes(lowercaseQuery)
  ).map((item) => {
    const [ticker, exchange] = item.symbol.split(":");
    return {
      symbol: ticker,
      name: item.name,
      exchange: exchange || "NSE",
      country: "India",
      type: "Common Stock",
    };
  });
}
