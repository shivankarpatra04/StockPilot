// filepath: src/types/index.ts

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  averageVolume: number;
  marketCap: number | null;
  trailingPE: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  revenueGrowth: number | null;
  currency: string;
}

export interface AIScore {
  score: number;
  label: "Strong Buy" | "Bullish" | "Neutral" | "Caution";
  breakdown: {
    dayChangeLarge: boolean;
    dayChangePositive: boolean;
    highVolume: boolean;
    aboveFiftyMA: boolean;
    aboveTwoHundredMA: boolean;
    lowPE: boolean;
  };
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  addedAt: Date;
}

export interface WatchlistWithStocks {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  stocks: WatchlistItem[];
}

export interface StockWithScore extends StockQuote {
  aiScore: AIScore;
}

export interface MarketStats {
  sentiment: "Bullish" | "Bearish" | "Neutral";
  topGainer: { symbol: string; changePercent: number } | null;
  topLoser: { symbol: string; changePercent: number } | null;
  mostActive: { symbol: string; volume: number } | null;
}

export interface ClaudeResponse {
  text: string;
  error?: string;
}

export interface OpportunityStock extends StockQuote {
  momentumScore: number;
  label: "Early Breakout" | "Momentum Rising" | "Smart Money Entry";
}

export interface AlertItem {
  id: string;
  userId: string;
  symbol: string;
  condition: string;
  targetPrice: number;
  triggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface ApiError {
  error: string;
  details?: string;
}
