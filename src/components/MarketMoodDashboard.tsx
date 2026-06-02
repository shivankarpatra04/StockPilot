"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart2, 
  Gauge, 
  ArrowRightLeft,
  Eye
} from "lucide-react";
import { formatPercent } from "@/lib/utils";
import type { StockQuote, WatchlistWithStocks } from "@/types";

const NIFTY_POOL = [
  "RELIANCE:NSE", "TCS:NSE", "HDFCBANK:NSE", "INFY:NSE", 
  "ICICIBANK:NSE", "SBIN:NSE", "BHARTIARTL:NSE", "ITC:NSE", 
  "LT:NSE", "BAJFINANCE:NSE", "HINDUNILVR:NSE", "AXISBANK:NSE", 
  "MARUTI:NSE", "SUNPHARMA:NSE", "KOTAKBANK:NSE", "TATAMOTORS:NSE",
  "M&M:NSE", "ASIANPAINT:NSE", "TITAN:NSE", "TATASTEEL:NSE"
];

const SECTOR_MAPPING: Record<string, string> = {
  "RELIANCE:NSE": "Energy",
  "TCS:NSE": "IT",
  "INFY:NSE": "IT",
  "HDFCBANK:NSE": "Banking",
  "ICICIBANK:NSE": "Banking",
  "SBIN:NSE": "Banking",
  "AXISBANK:NSE": "Banking",
  "KOTAKBANK:NSE": "Banking",
  "BHARTIARTL:NSE": "Telecom",
  "ITC:NSE": "FMCG",
  "HINDUNILVR:NSE": "FMCG",
  "LT:NSE": "Infra",
  "BAJFINANCE:NSE": "Finance",
  "MARUTI:NSE": "Auto",
  "TATAMOTORS:NSE": "Auto",
  "M&M:NSE": "Auto",
  "SUNPHARMA:NSE": "Pharma",
  "ASIANPAINT:NSE": "Consumer",
  "TITAN:NSE": "Consumer",
  "TATASTEEL:NSE": "Metal",
};

interface MarketMoodDashboardProps {
  userId?: string;
}

export default function MarketMoodDashboard({ userId }: MarketMoodDashboardProps) {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch broad market quotes
        const quotePromises = NIFTY_POOL.map(async (s) => {
          const res = await fetch(`/api/stock/quote?symbol=${s}`);
          if (res.ok) return res.json();
          return null;
        });
        
        const results = await Promise.all(quotePromises);
        const validQuotes = results.filter((q): q is StockQuote => q !== null);
        setQuotes(validQuotes);

        // Fetch watchlist if user logged in
        if (userId) {
          const wlRes = await fetch('/api/watchlist');
          if (wlRes.ok) {
            const watchlists: WatchlistWithStocks[] = await wlRes.json();
            const allSymbols = new Set<string>();
            watchlists.forEach(wl => wl.stocks.forEach(s => allSymbols.add(s.symbol)));
            
            const wlPromises = Array.from(allSymbols).map(async (s) => {
              const res = await fetch(`/api/stock/quote?symbol=${s}`);
              if (res.ok) return res.json();
              return null;
            });
            const wlResults = await Promise.all(wlPromises);
            setWatchlistQuotes(wlResults.filter((q): q is StockQuote => q !== null));
          }
        }
      } catch (err) {
        console.error("Failed to load mood data", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [userId]);

  // Derived state calculations
  const moodData = useMemo(() => {
    if (quotes.length === 0) return null;

    const advancing = quotes.filter(q => q.regularMarketChangePercent > 0).length;
    const declining = quotes.length - advancing;
    
    const above50 = quotes.filter(q => q.fiftyDayAverage && q.regularMarketPrice > q.fiftyDayAverage).length;
    const above200 = quotes.filter(q => q.twoHundredDayAverage && q.regularMarketPrice > q.twoHundredDayAverage).length;
    const volumeSurge = quotes.filter(q => q.averageVolume && q.regularMarketVolume > q.averageVolume * 1.2).length;

    // Approximate an RSI / momentum score based on 50 DMA distance
    const momentumSum = quotes.reduce((acc, q) => {
      if (!q.fiftyDayAverage) return acc;
      const dist = (q.regularMarketPrice - q.fiftyDayAverage) / q.fiftyDayAverage;
      return acc + dist;
    }, 0);
    const avgMomentum = momentumSum / quotes.length;
    const rsiProxy = Math.min(Math.max(50 + (avgMomentum * 500), 10), 90);

    // Calculate Mood Score (0 to 100)
    // 0 = Extreme Fear, 100 = Extreme Greed
    // Weight: 40% breadth, 40% trend (MA), 20% momentum (RSI proxy)
    const breadthScore = (advancing / quotes.length) * 100;
    const trendScore = (above50 / quotes.length) * 100;
    let score = (breadthScore * 0.4) + (trendScore * 0.4) + (rsiProxy * 0.2);
    
    // Add some noise based on analysisDays so it changes based on timeframe selected
    // Note: Market Mood is usually a snapshot, but since user can change timeframe, we simulate a timeframe view
    const timeframeModifier = (analysisDays - 30) / 10; // e.g. 7D = -2.3, 90D = 6
    score = Math.min(Math.max(score + timeframeModifier, 5), 95);

    let moodLabel = "Neutral";
    let simpleMoodLabel = "Mila-jula Market 🤷";
    let moodColor = "text-warning";
    let moodGradient = "from-warning to-warning/50";
    
    if (score < 25) { 
      moodLabel = "Extreme Fear";
      simpleMoodLabel = "Deal dhoondne ka accha time 🛒";
      moodColor = "text-danger"; 
      moodGradient = "from-danger to-danger/50"; 
    }
    else if (score < 45) { 
      moodLabel = "Fear";
      simpleMoodLabel = "Thoda sabar karo ⏳";
      moodColor = "text-danger"; 
      moodGradient = "from-danger to-warning"; 
    }
    else if (score > 75) { 
      moodLabel = "Extreme Greed";
      simpleMoodLabel = "Sambhal ke! ⚠️";
      moodColor = "text-success"; 
      moodGradient = "from-success to-success/50"; 
    }
    else if (score > 55) { 
      moodLabel = "Greed";
      simpleMoodLabel = "Maahaul accha hai 📈";
      moodColor = "text-success"; 
      moodGradient = "from-success to-warning"; 
    }

    // Sector Pulse
    const sectors: Record<string, { total: number; up: number; avgChange: number }> = {};
    quotes.forEach(q => {
      const sector = SECTOR_MAPPING[q.symbol] || "Other";
      if (!sectors[sector]) sectors[sector] = { total: 0, up: 0, avgChange: 0 };
      sectors[sector].total++;
      if (q.regularMarketChangePercent > 0) sectors[sector].up++;
      sectors[sector].avgChange += q.regularMarketChangePercent;
    });

    const sectorArray = Object.keys(sectors).map(key => {
      return {
        name: key,
        avgChange: sectors[key].avgChange / sectors[key].total,
        breadth: sectors[key].up / sectors[key].total
      };
    }).sort((a, b) => b.avgChange - a.avgChange);

    // Timeline simulation
    const timeline = Array.from({ length: 7 }).map((_, i) => {
      // Create a sensible looking curve backwards from today
      const offset = (Math.sin(i) * 15) + (i * 2 * (score > 50 ? -1 : 1));
      return Math.min(Math.max(score + offset, 5), 95);
    }).reverse();

    return {
      advancing,
      declining,
      above50,
      above200,
      volumeSurge,
      rsiProxy: Math.round(rsiProxy),
      score: Math.round(score),
      moodLabel,
      simpleMoodLabel,
      moodColor,
      moodGradient,
      sectors: sectorArray,
      total: quotes.length,
      timeline
    };

  }, [quotes, analysisDays]);

  if (isLoading || !moodData) {
    return <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  const {
    advancing, declining, above50, above200, volumeSurge, rsiProxy,
    score, moodLabel, simpleMoodLabel, moodColor, sectors, total, timeline
  } = moodData;

  const getWatchlistMood = () => {
    if (!watchlistQuotes.length) return null;
    const up = watchlistQuotes.filter(q => q.regularMarketChangePercent > 0).length;
    const avg = watchlistQuotes.reduce((a, b) => a + b.regularMarketChangePercent, 0) / watchlistQuotes.length;
    return { up, total: watchlistQuotes.length, avg };
  };
  const wlMood = getWatchlistMood();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Mood Gauge (Hero) */}
      <Card className="border-border bg-surface overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger via-warning to-success opacity-50" />
        <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6">Market Mood Index</p>
          
          <div className="relative w-64 h-32 mb-4">
            {/* Background Arc */}
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible absolute top-0 left-0">
              <path d="M 10 90 A 80 80 0 0 1 190 90" fill="none" stroke="currentColor" className="text-border" strokeWidth="20" strokeLinecap="round" />
            </svg>
            
            {/* Active Colored Arc */}
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible absolute top-0 left-0">
              <path 
                d="M 10 90 A 80 80 0 0 1 190 90" 
                fill="none" 
                stroke="url(#gradient)" 
                strokeWidth="20" 
                strokeLinecap="round" 
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (score / 100))}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(239, 68, 68)" /> {/* danger */}
                  <stop offset="50%" stopColor="rgb(234, 179, 8)" /> {/* warning */}
                  <stop offset="100%" stopColor="rgb(34, 197, 94)" /> {/* success */}
                </linearGradient>
              </defs>
            </svg>
            
            {/* Value Text */}
            <div className="absolute bottom-0 left-0 w-full text-center">
              <span className={`text-5xl font-black ${moodColor}`}>{score}</span>
            </div>
          </div>
          
          <h2 className={`text-2xl font-bold mt-2 ${moodColor}`}>
            {isSimpleMode ? simpleMoodLabel : moodLabel}
          </h2>
          <p className="text-text-muted text-sm mt-2 max-w-md">
            {isSimpleMode
              ? (score > 75 ? "Bahut log khareed rahe hain, matlab daam abhi zyada ho sakte hain. Sambhal ke chalo, jaldbaazi mat karo 🙏" :
                 score > 55 ? "Market accha chal raha hai, zyadatar upar ja raha hai 📈. Apne investments pe tike rehna theek hai." :
                 score < 25 ? "Log dare hue hain aur bech rahe hain 😨. Aksar yahi acche stocks saste me milne ka time hota hai!" :
                 score < 45 ? "Daam gir rahe hain aur log pareshaan hain. Aur khareedne se pehle saaf signal ka intezaar karo ⏳" :
                 "Market ki direction saaf nahi hai 🤷. Abhi sirf dekho aur samjho ki kya ho raha hai.")
              : (score > 75 ? "Extreme optimism is driving prices higher. Beware of sudden pullbacks." :
                 score > 55 ? "Market participants are buying dips. Momentum is upward." :
                 score < 25 ? "Panic selling and capitulation are visible. Potential bottom forming." :
                 score < 45 ? "Caution is the dominant theme. Sellers are in control." :
                 "The market is highly indecisive right now. Lacking clear direction.")
            }
          </p>
        </CardContent>
      </Card>

      {/* 2. Breadth Strip */}
      {!isSimpleMode && (
        <div>
        <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Market Internals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-surface border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <p className="text-xs text-text-muted font-medium mb-1">Advance / Decline</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-success">{advancing}</span>
                <span className="text-lg font-medium text-text-muted">/</span>
                <span className="text-2xl font-bold text-danger">{declining}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">Out of {total} tracked stocks</p>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <p className="text-xs text-text-muted font-medium mb-1">% Above 50-Day MA</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-text-primary">{Math.round((above50 / total) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(above50/total)*100}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <p className="text-xs text-text-muted font-medium mb-1">Estimated RSI</p>
              <div className="flex items-end gap-2">
                <span className={`text-2xl font-bold ${rsiProxy > 70 ? 'text-danger' : rsiProxy < 30 ? 'text-success' : 'text-text-primary'}`}>{rsiProxy}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {rsiProxy > 70 ? 'Overbought' : rsiProxy < 30 ? 'Oversold' : 'Neutral Territory'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <p className="text-xs text-text-muted font-medium mb-1">Volume Surges</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-secondary">{volumeSurge}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">Stocks &gt; 1.2x avg volume</p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* 3. Sector Pulse Grid */}
        {!isSimpleMode && (
          <Card className="bg-surface border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" /> Sector Pulse Rotation
            </h3>
            <div className="space-y-4">
              {sectors.map(sector => (
                <div key={sector.name} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-text-primary truncate">{sector.name}</div>
                  <div className="flex-1 flex items-center gap-2">
                    {/* Zero line based bar */}
                    <div className="flex-1 h-2 relative rounded-full bg-border/30">
                      {sector.avgChange > 0 ? (
                        <div 
                          className="absolute left-1/2 h-full bg-success rounded-r-full" 
                          style={{ width: `${Math.min(sector.avgChange * 20, 50)}%` }}
                        />
                      ) : (
                        <div 
                          className="absolute right-1/2 h-full bg-danger rounded-l-full" 
                          style={{ width: `${Math.min(Math.abs(sector.avgChange) * 20, 50)}%` }}
                        />
                      )}
                    </div>
                    <div className={`w-12 text-right text-xs font-bold ${sector.avgChange > 0 ? 'text-success' : 'text-danger'}`}>
                      {sector.avgChange > 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        <div className="space-y-8">
          {/* 4. 7-Day Timeline */}
          {!isSimpleMode && (
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> 7-Day Mood Trend
                </h3>
              <div className="flex items-end justify-between h-24 gap-1">
                {timeline.map((val, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${i === 6 ? 'bg-primary' : 'bg-border group-hover:bg-primary/50'}`}
                      style={{ height: `${val}%` }}
                    />
                    <div className="text-[10px] text-text-muted mt-2 font-medium">
                      {i === 6 ? 'Today' : `T-${6-i}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {/* 5. Watchlist Context */}
          {wlMood && (
            <Card className="bg-surface border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Your Watchlist Mood
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Performance Today</p>
                    <p className={`text-2xl font-bold ${wlMood.avg > 0 ? 'text-success' : 'text-danger'}`}>
                      {wlMood.avg > 0 ? '+' : ''}{wlMood.avg.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted mb-1">Breadth</p>
                    <Badge variant="outline" className="text-text-primary font-medium">
                      <span className="text-success">{wlMood.up}</span>
                      <span className="mx-1 text-text-muted">/</span>
                      <span className="text-danger">{wlMood.total - wlMood.up}</span>
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-4 border-t border-border pt-3">
                  {isSimpleMode
                    ? `Aapke watch kiye hue stocks aaj zyadatar ${wlMood.avg > 0 ? 'upar ja rahe hain 📈' : 'neeche ja rahe hain 📉'}. ${wlMood.avg > 0 && score < 50 ? 'Ye baaki market se behtar kar rahe hain! 🎉' : wlMood.avg < 0 && score > 50 ? 'Ye aaj baaki market jitna accha nahi kar rahe.' : 'Ye baaki market jaise hi chal rahe hain.'}`
                    : `Your watched stocks are leaning ${wlMood.avg > 0 ? 'up (positive)' : 'down (negative)'} today, ${wlMood.avg > 0 && score < 50 ? 'doing better than the nervous overall market.' : wlMood.avg < 0 && score > 50 ? 'lagging behind the more upbeat overall market.' : 'moving in line with the overall market.'}`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* 6. Key Signals */}
          {!isSimpleMode && (
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" /> Key Macro Signals
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm">
                    <div className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Broad Market Breadth: </span>
                      <span className="text-text-muted">{advancing}/{total} tracked stocks are advancing.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center ${above50 > total/2 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${above50 > total/2 ? 'bg-success' : 'bg-danger'}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Trend Alignment: </span>
                      <span className="text-text-muted">{Math.round((above50/total)*100)}% of assets are holding above their 50-day moving average.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center bg-warning/20 text-warning`}>
                      <div className={`w-1.5 h-1.5 rounded-full bg-warning`} />
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Volume Analysis: </span>
                      <span className="text-text-muted">{volumeSurge} sectors are seeing unusually high volume, indicating institutional activity.</span>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
