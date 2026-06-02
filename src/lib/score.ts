// Shared technical-scoring logic used by both the live scanner
// (api/cron/scan-stocks) and the backtest harness, so backtests evaluate the
// EXACT same strategy the app ships. Do not fork this logic.

export interface Candle {
  time: number;
  open?: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface BuyScore {
  score: number;
  change: number;
  rsi: number;
  reasoning: string;
  support: number;
  resistance: number;
  stopLoss: number;
  target: number;
  aboveSMA20: boolean;
  currentPrice: number;
}

export function calculateRSI(candles: Candle[]): number {
  if (candles.length < 14) return 50;
  let gains = 0,
    losses = 0;
  for (let i = candles.length - 14; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
}

export function calculateBuyScore(candles: Candle[], _symbol?: string): BuyScore | null {
  const valid = candles.filter(
    (c) =>
      c &&
      c.close != null &&
      !isNaN(c.close) &&
      c.low != null &&
      !isNaN(c.low) &&
      c.high != null &&
      !isNaN(c.high)
  );
  if (valid.length < 5) return null;

  const currentPrice = valid[valid.length - 1].close;
  const startPrice = valid[0].close;
  const change = ((currentPrice - startPrice) / startPrice) * 100;

  const rsi = calculateRSI(valid);
  let minPrice = currentPrice,
    maxPrice = currentPrice;
  for (const c of valid) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  }
  const range = maxPrice - minPrice || 1;
  const supportProximity = (maxPrice - currentPrice) / range;

  const count = Math.min(20, valid.length);
  const sma20 = valid.slice(-count).reduce((s, c) => s + c.close, 0) / count;

  let rsiScore = 50;
  if (rsi < 30) rsiScore = 95;
  else if (rsi < 45) rsiScore = 80;
  else if (rsi < 60) rsiScore = 60;
  else if (rsi < 70) rsiScore = 35;
  else rsiScore = 15;

  const supportScore = Math.min(supportProximity * 100, 100);
  const trendScore = currentPrice > sma20 ? 80 : 35;

  const score = Math.round(rsiScore * 0.4 + supportScore * 0.3 + trendScore * 0.3);

  let reasoning = "";
  if (score >= 75)
    reasoning = `Excellent buy opportunity. RSI is oversold at ${rsi.toFixed(0)}, near strong support at ₹${minPrice.toFixed(2)}.`;
  else if (score >= 60)
    reasoning = `Solid upward momentum, trading above 20-day average of ₹${sma20.toFixed(2)}.`;
  else if (score >= 45)
    reasoning = `Moving sideways in neutral range between ₹${minPrice.toFixed(2)} and ₹${maxPrice.toFixed(2)}.`;
  else
    reasoning = `Overbought with RSI at ${rsi.toFixed(0)}. High pullback risk near resistance ₹${maxPrice.toFixed(2)}.`;

  return {
    score: Math.max(0, Math.min(100, score)),
    change: +change.toFixed(2),
    rsi: +rsi.toFixed(1),
    reasoning,
    support: +minPrice.toFixed(2),
    resistance: +maxPrice.toFixed(2),
    stopLoss: +(minPrice * 0.96).toFixed(2),
    target: +(maxPrice * 1.05).toFixed(2),
    aboveSMA20: currentPrice > sma20,
    currentPrice: +currentPrice.toFixed(2),
  };
}
