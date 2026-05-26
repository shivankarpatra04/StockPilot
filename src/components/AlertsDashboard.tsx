"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Trash2, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  CheckCircle2, 
  Activity,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import StockSearch from "@/components/StockSearch";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { AlertItem, StockQuote, WatchlistWithStocks } from "@/types";

interface AlertsDashboardProps {
  userId?: string;
}

export default function AlertsDashboard({ userId }: AlertsDashboardProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  // New Alert State
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [currentQuote, setCurrentQuote] = useState<StockQuote | null>(null);

  // Load Alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
      
      const wlRes = await fetch("/api/watchlist");
      if (wlRes.ok) {
        const watchlists: WatchlistWithStocks[] = await wlRes.json();
        let count = 0;
        watchlists.forEach(w => count += w.stocks.length);
        setWatchlistCount(count);
      }
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Fetch quote when symbol is selected for the new alert form
  useEffect(() => {
    if (!symbol) {
      setCurrentQuote(null);
      return;
    }
    const getQuote = async () => {
      const res = await fetch(`/api/stock/quote?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentQuote(data);
        if (condition === "above") {
          setTargetPrice((data.regularMarketPrice * 1.05).toFixed(2));
        } else {
          setTargetPrice((data.regularMarketPrice * 0.95).toFixed(2));
        }
      }
    };
    getQuote();
  }, [symbol]);

  // Handle setting a new alert
  const handleCreateAlert = async () => {
    if (!symbol || !targetPrice) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          condition,
          targetPrice: parseFloat(targetPrice)
        })
      });
      if (res.ok) {
        setSymbol("");
        setTargetPrice("");
        setCurrentQuote(null);
        fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to create alert", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete alert", err);
    }
  };

  // The Check Now function: evaluates all active alerts against current prices
  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      const activeAlerts = alerts.filter(a => !a.triggered);
      if (activeAlerts.length === 0) return;

      const symbols = Array.from(new Set(activeAlerts.map(a => a.symbol)));
      const quotes: Record<string, StockQuote> = {};
      
      // Fetch fresh quotes
      await Promise.all(symbols.map(async (sym) => {
        const res = await fetch(`/api/stock/quote?symbol=${sym}`);
        if (res.ok) quotes[sym] = await res.json();
      }));

      // Evaluate
      for (const alert of activeAlerts) {
        const q = quotes[alert.symbol];
        if (!q) continue;

        let triggered = false;
        if (alert.condition === "above" && q.regularMarketPrice >= alert.targetPrice) triggered = true;
        if (alert.condition === "below" && q.regularMarketPrice <= alert.targetPrice) triggered = true;

        if (triggered) {
          await fetch("/api/alerts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: alert.id, triggered: true })
          });
        }
      }
      
      // Refresh list to show updated states
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to check alerts", err);
    } finally {
      setIsChecking(false);
    }
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const alertedSymbols = new Set(alerts.map(a => a.symbol)).size;

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Active Alerts</p>
              <p className="text-2xl font-bold text-text-primary">{activeAlerts.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Triggered</p>
              <p className="text-2xl font-bold text-success">{triggeredAlerts.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Portfolio Coverage</p>
              <p className="text-2xl font-bold text-secondary">
                {alertedSymbols} <span className="text-sm font-medium text-text-muted">/ {watchlistCount}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Create Alert Panel */}
        <div className="md:col-span-4 space-y-4">
          <Card className="bg-surface border-border sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Create Alert</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Asset</label>
                  <StockSearch onSelect={(sym) => setSymbol(sym)} />
                  {symbol && (
                    <div className="mt-2 flex items-center justify-between px-3 py-2 bg-background rounded-lg border border-border text-sm">
                      <span className="font-bold text-text-primary">{symbol}</span>
                      <button onClick={() => setSymbol("")} className="text-xs text-danger hover:underline">Change</button>
                    </div>
                  )}
                </div>

                {symbol && currentQuote && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                      <span className="text-sm text-text-muted">Current Price</span>
                      <span className="font-bold text-text-primary">{formatCurrency(currentQuote.regularMarketPrice, currentQuote.currency)}</span>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Condition</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={condition === "above" ? "secondary" : "outline"}
                          className={`h-9 text-xs ${condition === "above" ? "bg-secondary/20 text-secondary border-secondary/50 hover:bg-secondary/30" : ""}`}
                          onClick={() => {
                            setCondition("above");
                            setTargetPrice((currentQuote.regularMarketPrice * 1.05).toFixed(2));
                          }}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Rises Above
                        </Button>
                        <Button 
                          variant={condition === "below" ? "destructive" : "outline"}
                          className={`h-9 text-xs ${condition === "below" ? "bg-danger/20 text-danger border-danger/50 hover:bg-danger/30" : ""}`}
                          onClick={() => {
                            setCondition("below");
                            setTargetPrice((currentQuote.regularMarketPrice * 0.95).toFixed(2));
                          }}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Falls Below
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Target Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">₹</span>
                        <Input 
                          type="number" 
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="pl-7 bg-background"
                        />
                      </div>
                      {targetPrice && (
                        <p className="text-[10px] text-text-muted mt-2 px-1">
                          Alert triggers <strong className={condition === "above" ? "text-secondary" : "text-danger"}>
                            {Math.abs(((parseFloat(targetPrice) - currentQuote.regularMarketPrice) / currentQuote.regularMarketPrice) * 100).toFixed(1)}% 
                          </strong> away from current price.
                        </p>
                      )}
                    </div>

                    <Button 
                      className="w-full mt-2" 
                      onClick={handleCreateAlert}
                      disabled={isCreating || !targetPrice}
                    >
                      {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                      Set Alert
                    </Button>
                  </>
                )}
                
                {!symbol && (
                  <div className="py-8 text-center border-2 border-dashed border-border rounded-xl mt-4">
                    <AlertCircle className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-text-muted">Search a symbol to configure your alert parameters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Lists */}
        <div className="md:col-span-8 space-y-6">
          {/* Active Alerts */}
          <Card className="bg-surface border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Active Monitoring
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCheckNow}
                disabled={isChecking || activeAlerts.length === 0}
                className="h-8 text-xs font-medium hover:text-primary hover:border-primary/50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
                Check Status Now
              </Button>
            </div>
            
            <div className="divide-y divide-border/50">
              {activeAlerts.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  No active alerts. Add one from the panel.
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} onDelete={() => handleDelete(alert.id)} />
                ))
              )}
            </div>
          </Card>

          {/* Triggered Log */}
          {triggeredAlerts.length > 0 && (
            <Card className="bg-surface border-border opacity-90 hover:opacity-100 transition-opacity">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Triggered Log
                </h3>
                <button 
                  onClick={() => triggeredAlerts.forEach(a => handleDelete(a.id))}
                  className="text-xs text-danger hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto">
                {triggeredAlerts.map(alert => (
                  <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-card/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-text-primary">{alert.symbol}</span>
                        <Badge variant="success" className="text-[10px] py-0">Triggered</Badge>
                      </div>
                      <p className="text-xs text-text-muted">
                        Hit target of {formatCurrency(alert.targetPrice, "INR")} ({alert.condition})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(alert.symbol)}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/10">
                          Analyse <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                      <button onClick={() => handleDelete(alert.id)} className="text-text-muted hover:text-danger p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for an active alert row to handle its own local quote fetching for the progress bar
function AlertRow({ alert, onDelete }: { alert: AlertItem, onDelete: () => void }) {
  const [quote, setQuote] = useState<StockQuote | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/stock/quote?symbol=${alert.symbol}`);
        if (res.ok) {
          setQuote(await res.json());
        }
      } catch (e) {
        // quiet fail
      }
    };
    fetchQuote();
  }, [alert.symbol]);

  // Calculate progress
  let progress = 0;
  if (quote) {
    // Determine a "start" price logic. Since we don't store the price when the alert was created,
    // we just use a visual ratio of distance. 
    // Example: if condition is above, and price is X, target is Y.
    // We can show how close X is to Y.
    const dist = Math.abs((alert.targetPrice - quote.regularMarketPrice) / quote.regularMarketPrice) * 100;
    // Cap at 20% distance for the bar
    progress = Math.max(0, Math.min(100, 100 - (dist / 20 * 100)));
  }

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-card/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-text-primary text-base">{alert.symbol}</span>
          <Badge 
            variant={alert.condition === "above" ? "secondary" : "destructive"} 
            className={`text-[10px] uppercase tracking-wider ${alert.condition === "above" ? "bg-secondary/20 text-secondary" : "bg-danger/20 text-danger"}`}
          >
            {alert.condition === "above" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {alert.condition} {formatCurrency(alert.targetPrice, "INR")}
          </Badge>
        </div>
        
        {/* Progress Bar Area */}
        <div className="flex items-center gap-4 mt-3">
          <div className="text-xs text-text-muted whitespace-nowrap min-w-[60px]">
            {quote ? formatCurrency(quote.regularMarketPrice, quote.currency) : "Loading..."}
          </div>
          
          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border relative">
            <div 
              className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${alert.condition === "above" ? "bg-secondary" : "bg-danger"}`}
              style={{ width: `${quote ? progress : 0}%` }}
            />
          </div>
          
          <div className="text-[10px] font-medium text-text-muted whitespace-nowrap min-w-[50px] text-right">
            {quote ? `${Math.abs(((alert.targetPrice - quote.regularMarketPrice)/quote.regularMarketPrice)*100).toFixed(1)}% away` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-border/50">
        <button 
          onClick={onDelete}
          className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          title="Delete Alert"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
