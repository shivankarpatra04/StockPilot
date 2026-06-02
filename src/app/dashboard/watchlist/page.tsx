"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Plus, 
  Bookmark, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Folder,
  ChevronRight,
  X,
  Zap,
  Star,
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Info
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StockQuote } from "@/types";


const TABS = ["Overview", "Alerts", "Groups", "Performance"];
const POPULAR_PICKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS"];

import { useAppStore } from "@/store/useAppStore";

// Each alert type maps to a comparison direction ("above"/"below") and a display style.
const ALERT_TYPE_META: Record<string, { label: string; color: string; condition: "above" | "below" }> = {
  TARGET: { label: "Target", color: "bg-secondary", condition: "above" },
  STOP_LOSS: { label: "Stop Loss", color: "bg-danger", condition: "below" },
  BUY_ZONE: { label: "Buy Zone", color: "bg-blue-500", condition: "below" },
  SELL_ZONE: { label: "Sell Zone", color: "bg-amber-500", condition: "above" },
  CUSTOM: { label: "Custom", color: "bg-primary", condition: "above" },
};

// Convert a raw alert row from the API into the shape the Alerts tab renders.
function formatAlert(a: any) {
  const meta = ALERT_TYPE_META[a.alertType] || ALERT_TYPE_META.CUSTOM;
  const arrow = a.condition === "above" ? "≥" : "≤";
  return {
    id: a.id,
    symbol: a.symbol.split(":")[0],
    desc: a.note ? a.note : `${arrow} ₹${a.targetPrice}`,
    type: meta.label,
    status: a.triggered ? "Triggered" : "Active",
    time: new Date(a.createdAt).toLocaleDateString(),
    typeColor: meta.color,
  };
}

export default function WatchlistPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { analysisDays } = useAppStore();
  const [stocks, setStocks] = useState<any[]>([]);
  const stocksRef = useRef<any[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStockStep, setAddStockStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groups, setGroups] = useState<string[]>(["Banking", "IT", "Swing trades", "Long term"]);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Alerts state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertForm, setAlertForm] = useState<{
    symbol: string;
    alertType: string;
    condition: "above" | "below";
    targetPrice: string;
    note: string;
  }>({ symbol: "", alertType: "TARGET", condition: "above", targetPrice: "", note: "" });

  // Performance state
  const [buyPrices, setBuyPrices] = useState<Record<string, number>>({});
  const [editingBuyPrice, setEditingBuyPrice] = useState<string | null>(null);
  const [tempBuyPrice, setTempBuyPrice] = useState("");

  // Hydration and Loading
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load Watchlist
        const watchRes = await fetch("/api/watchlist");
        if (watchRes.ok) {
          const data = await watchRes.json();
          const allStocks = data.flatMap((w: any) => 
            w.stocks.map((s: any) => ({
              symbol: s.symbol,
              group: s.group,
              price: s.price || 0,
              buyPrice: s.buyPrice || 0,
              change: s.change || 0,
              verdict: s.verdict || "Wait",
              verdictText: s.verdictText || "Ready for analysis",
              confidence: s.confidence || 0,
              lastUpdated: s.lastUpdated,
              isLoading: false
            }))
          );
          
          setStocks(allStocks);
          
          // Map buy prices for Performance tab
          const bPrices: Record<string, number> = {};
          allStocks.forEach((s: any) => {
            if (s.buyPrice) bPrices[s.symbol] = s.buyPrice;
          });
          setBuyPrices(bPrices);

          // Extract unique groups
          const uniqueGroups = Array.from(new Set(allStocks.map((s: any) => s.group).filter(Boolean))) as string[];
          if (uniqueGroups.length > 0) {
            setGroups(prev => Array.from(new Set([...prev, ...uniqueGroups])));
          }
        }

        // 2. Load Alerts
        const alertRes = await fetch("/api/alerts");
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setAlerts(alertData.map(formatAlert));
        }
      } catch (err) {
        console.error("Failed to load data from DB:", err);
      } finally {
        setIsMounted(true);
      }
    }
    loadData();
  }, []);

  // Groups Tab State
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [groupInput, setGroupInput] = useState("");

  // Fetch Live Data for a symbol
  const refreshStockData = useCallback(async (symbol: string, days: number = 30) => {
    try {
      // 1. Fetch Quote
      const quoteRes = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!quoteRes.ok) throw new Error("Failed to fetch quote");
      const quote: StockQuote = await quoteRes.json();

      // 2. Fetch System Analysis (Verdict/Signal)
      let aiAnalysis = null;
      try {
        const aiRes = await fetch("/api/claude/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, days })
        });
        if (aiRes.ok) {
          aiAnalysis = await aiRes.json();
        }
      } catch (err) {
        console.warn(`technical analysis failed for ${symbol}:`, err);
      }

      const stockData = {
        symbol: quote.symbol,
        name: quote.shortName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChangePercent,
        verdict: aiAnalysis?.action || "Wait",
        verdictText: aiAnalysis?.verdict || (aiAnalysis ? "Analysis complete" : "Analysis failed"),
        confidence: typeof aiAnalysis?.probability?.profitProb === 'number' ? aiAnalysis.probability.profitProb : 50,
        hasSignal: !!aiAnalysis,
        lastUpdated: new Date().toISOString(),
        lastAnalysisRange: days
      };

      // Save to DB
      fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData)
      }).catch(e => console.error("Failed to persist analysis:", e));

      return stockData;
    } catch (err) {
      console.error(`Error refreshing ${symbol}:`, err);
      return null;
    }
  }, []);
  const handleRefreshAll = useCallback(async () => {
    const currentStocks = stocksRef.current;
    if (currentStocks.length === 0) return;
    setIsRefreshing(true);
    
    const results = [];
    const now = Date.now();

    for (const stock of currentStocks) {
      // If stock was updated in the last 15 minutes AND with the same range, skip it
      const isFresh = stock.lastUpdated && (now - new Date(stock.lastUpdated).getTime() < 900000);
      const isSameRange = stock.lastAnalysisRange === analysisDays;
      
      if (isFresh && isSameRange) {
        results.push(stock);
        continue;
      }

      const data = await refreshStockData(stock.symbol, analysisDays);
      results.push(data || stock);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setStocks(results);
    setIsRefreshing(false);
    setToast("Watchlist synchronized");
    setTimeout(() => setToast(null), 3000);
  }, [analysisDays, refreshStockData]);

  // Auto-refresh on mount if data is stale (> 1 hour)
  useEffect(() => {
    if (isMounted && stocks.length > 0) {
      const now = Date.now();
      const hasStaleData = stocks.some(s => {
        if (!s.lastUpdated) return true;
        const lastUpdate = new Date(s.lastUpdated).getTime();
        return now - lastUpdate > 3600000; // 1 hour
      });

      if (hasStaleData) {
        console.log("[Watchlist] Auto-refreshing stale data...");
        handleRefreshAll();
      }
    }
  }, [isMounted, handleRefreshAll]); // Removed stocks from here as handleRefreshAll depends on it

  // Trigger refresh when global analysis range changes
  useEffect(() => {
    if (isMounted && stocksRef.current.length > 0) {
      console.log(`[Watchlist] Range changed to ${analysisDays}D. Refreshing...`);
      handleRefreshAll();
    }
  }, [analysisDays]); // Removed handleRefreshAll to break the loop

  // Persist buy prices to DB when they change
  const handleUpdateBuyPrice = async (symbol: string) => {
    const val = parseFloat(tempBuyPrice);
    if (!isNaN(val)) {
      setBuyPrices(prev => ({ ...prev, [symbol]: val }));
      try {
        await fetch("/api/watchlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, buyPrice: val })
        });
      } catch (err) {
        console.error("Failed to persist buy price:", err);
      }
    }
    setEditingBuyPrice(null);
    setTempBuyPrice("");
  };

  // Live Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isEmpty = stocks.length === 0;
  const flaggedStocks = stocks.filter(s => s.hasSignal);
  
  // Grouping logic including "Ungrouped"
  const groupedBySelection = stocks.reduce((acc, stock) => {
    const groupName = stock.group || "Ungrouped";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(stock);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = !isEmpty ? {
    pnl: "+₹14,250.00",
    pnlPositive: true,
    topGainer: `${[...stocks].sort((a, b) => b.change - a.change)[0]?.symbol.split(":")[0]} (+${[...stocks].sort((a, b) => b.change - a.change)[0]?.change.toFixed(2)}%)`,
    topLoser: `${[...stocks].sort((a, b) => a.change - b.change)[0]?.symbol.split(":")[0]} (${[...stocks].sort((a, b) => a.change - b.change)[0]?.change.toFixed(2)}%)`,
    aiSignals: flaggedStocks.length
  } : {
    pnl: "--",
    pnlPositive: true,
    topGainer: "--",
    topLoser: "--",
    aiSignals: 0
  };

  const handleCreateAlert = async () => {
    const price = parseFloat(alertForm.targetPrice);
    if (!alertForm.symbol || isNaN(price) || price <= 0) {
      setToast("Pick a stock and enter a valid price");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const condition = alertForm.alertType === "CUSTOM"
      ? alertForm.condition
      : ALERT_TYPE_META[alertForm.alertType].condition;

    setIsCreatingAlert(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: alertForm.symbol,
          condition,
          alertType: alertForm.alertType,
          targetPrice: price,
          note: alertForm.note.trim() || null,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setAlerts(prev => [formatAlert(created), ...prev]);
        setIsAddingAlert(false);
        setAlertForm({ symbol: "", alertType: "TARGET", condition: "above", targetPrice: "", note: "" });
        setToast("Alert created");
      } else {
        setToast("Failed to create alert");
      }
    } catch (err) {
      console.error("Create alert error:", err);
      setToast("Failed to create alert");
    } finally {
      setIsCreatingAlert(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
    setAlertToDelete(null);
  };


  const handleDeleteStock = async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        setStocks(prev => prev.filter(s => s.symbol !== symbol));
        setToast(`Removed ${symbol.split(":")[0]} from watchlist`);
        setTimeout(() => setToast(null), 3000);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setToast("Failed to remove stock");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleOpenAddModal = (symbol?: string) => {
    if (symbol) {
      setSearchQuery(symbol);
    } else {
      setSearchQuery("");
    }
    setAddStockStep(1);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStock(null);
    setSelectedGroup(null);
    setIsAddingGroup(false);
    setNewGroupName("");
    setAddStockStep(1);
  };

  const handleConfirmAdd = async () => {
    // Duplicate check
    if (stocks.some(s => s.symbol === selectedStock.symbol)) {
      setToast(`${selectedStock.symbol.split(":")[0]} is already in your watchlist`);
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Add with basic data first
    const baseStock = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      price: selectedStock.price,
      change: selectedStock.change,
      verdict: "Wait",
      verdictText: "Analyzing...",
      confidence: 0,
      hasSignal: false,
      group: selectedGroup,
      isLoading: true
    };
    
    setStocks(prev => [...prev, baseStock]);
    setAddStockStep(3);

    // Save to DB
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          symbol: selectedStock.symbol, 
          group: selectedGroup 
        })
      });
    } catch (err) {
      console.error("Failed to save to DB:", err);
    }

    // Fetch live analysis immediately for the new stock
    try {
      const res = await fetch("/api/claude/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selectedStock.symbol, days: analysisDays })
      });
      
      if (res.ok) {
        const aiData = await res.json();
        
        // Update stock with live system data
        setStocks(prev => prev.map(s => s.symbol === selectedStock.symbol ? {
          ...s,
          price: aiData.currentPrice || s.price,
          change: aiData.change || s.change,
          verdict: aiData.action || "Wait",
          verdictText: aiData.verdict || "",
          confidence: aiData.probability?.profitProb || 50,
          hasSignal: true,
          isLoading: false
        } : s));
      } else {
        setStocks(prev => prev.map(s => s.symbol === selectedStock.symbol ? { 
          ...s, 
          verdictText: "Analysis unavailable for this ticker",
          isLoading: false 
        } : s));
        setToast(`System could not analyze ${selectedStock.symbol} at this time.`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error("System analysis error during add:", err);
      setStocks(prev => prev.map(s => s.symbol === selectedStock.symbol ? { 
        ...s, 
        verdictText: "Connection error",
        isLoading: false 
      } : s));
    }
  };

  const handleAddNewGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      setGroups(prev => [...prev, newGroupName.trim()]);
      setSelectedGroup(newGroupName.trim());
      setNewGroupName("");
      setIsAddingGroup(false);
    }
  };

  const handleCreateGroupTab = () => {
    if (groupInput.trim() && !groups.includes(groupInput.trim())) {
      setGroups(prev => [...prev, groupInput.trim()]);
      setGroupInput("");
      setIsCreatingGroup(false);
    }
  };

  const handleRenameGroup = (oldName: string) => {
    if (groupInput.trim() && groupInput !== oldName) {
      setGroups(prev => prev.map(g => g === oldName ? groupInput : g));
      setStocks(prev => prev.map(s => s.group === oldName ? { ...s, group: groupInput } : s));
      setEditingGroup(null);
      setGroupInput("");
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    setGroups(prev => prev.filter(g => g !== groupName));
    setStocks(prev => prev.map(s => s.group === groupName ? { ...s, group: null } : s));
    setDeletingGroup(null);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
          <div className="bg-primary text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">My Watchlist</h1>
          <p className="text-text-muted text-sm mt-1">
            {stocks.length} stocks · Live market data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefreshAll}
            disabled={isRefreshing || isEmpty}
            variant="outline"
            className="border-border hover:bg-surface rounded-full w-10 h-10 p-0"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </Button>
          <Button 
            onClick={() => handleOpenAddModal()}
            className="bg-primary hover:bg-primary/90 text-white shadow-glow rounded-full w-10 h-10 p-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>



      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-20 -mx-6 px-6 bg-background/80 backdrop-blur-md border-b border-border/50 h-12 flex items-center gap-6 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-sm font-bold whitespace-nowrap h-full relative transition-colors",
              activeTab === tab
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow" />
            )}
          </button>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's P&L", value: stats.pnl, color: stats.pnlPositive ? "text-secondary" : "text-danger" },
          { label: "Top Gainer", value: stats.topGainer, color: "text-secondary" },
          { label: "Top Loser", value: stats.topLoser, color: "text-danger" },
          { label: "System Signals", value: `${stats.aiSignals} New`, color: "text-primary" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={cn("text-sm font-bold truncate", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-6">
            <Star className="w-10 h-10 text-text-muted opacity-20" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Your watchlist is empty</h2>
          <p className="text-text-muted text-sm max-w-xs mb-8">
            Add stocks to track prices, get system signals and set alerts
          </p>
          <Button 
            onClick={() => handleOpenAddModal()}
            className="bg-primary hover:bg-primary/90 text-white shadow-glow px-8 rounded-full h-12"
          >
            Add your first stock
          </Button>

          <div className="mt-12 w-full max-w-lg">
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-4">Popular Picks</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_PICKS.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => handleOpenAddModal(symbol)}
                  className="px-4 py-1.5 rounded-full bg-surface border border-border text-xs font-bold text-text-muted hover:text-primary hover:border-primary/30 transition-all"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Non-Empty State */
        <div className="space-y-10">
          {activeTab === "Overview" && (
            <>
              {/* All Stocks Grouped by Selection */}
              <section className="space-y-6">
                <h2 className="text-lg font-bold text-text-primary">All Stocks</h2>
                {Object.entries(groupedBySelection).map(([group, groupStocks]) => {
                  const stocksList = groupStocks as any[];
                  return (
                    <div key={group} className="space-y-3">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Folder className={cn("w-4 h-4", group === "Ungrouped" ? "opacity-30" : "text-primary")} />
                        <span className="text-xs font-bold uppercase tracking-widest">{group}</span>
                        <span className="h-px flex-1 bg-border/30 ml-2" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stocksList.map((stock: any) => (
                          <StockCard key={stock.symbol} stock={stock} onRemove={handleDeleteStock} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}

          {activeTab === "Alerts" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Price Alerts</h2>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                    {alerts.length} Alerts
                  </Badge>
                  {!isAddingAlert && (
                    <Button
                      onClick={() => {
                        setAlertForm(f => ({ ...f, symbol: stocks[0]?.symbol || "" }));
                        setIsAddingAlert(true);
                      }}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-1.5 h-8 text-xs"
                    >
                      <Plus className="w-4 h-4" /> New alert
                    </Button>
                  )}
                </div>
              </div>

              {isAddingAlert && (
                <AlertCreateForm
                  stocks={stocks}
                  form={alertForm}
                  setForm={setAlertForm}
                  onCreate={handleCreateAlert}
                  onCancel={() => setIsAddingAlert(false)}
                  isCreating={isCreatingAlert}
                />
              )}

              {alerts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Bookmark className="w-12 h-12 text-text-muted opacity-20 mb-4" />
                  <h3 className="text-xl font-bold text-text-primary mb-2">No alerts set</h3>
                  <p className="text-text-muted text-sm mb-6 max-w-xs">Create a price alert and we&apos;ll notify you when it&apos;s hit.</p>
                  <Button
                    onClick={() => {
                      setAlertForm(f => ({ ...f, symbol: stocks[0]?.symbol || "" }));
                      setIsAddingAlert(true);
                    }}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
                  >
                    Create an alert
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="relative overflow-hidden group">
                      <div className={cn(
                        "p-4 rounded-xl bg-card border border-border transition-all flex items-center justify-between",
                        alertToDelete === alert.id && "opacity-20 blur-[2px]"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-opacity-10",
                            alert.status === "Active" ? "bg-secondary text-secondary" : "bg-text-muted text-text-muted"
                          )}>
                            <Bookmark className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">
                              <span className="text-primary font-black mr-2">{alert.symbol}</span>
                              {alert.desc}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded text-white", alert.typeColor)}>
                                {alert.type}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                alert.status === "Active" ? "bg-secondary/10 border-secondary/20 text-secondary" : "bg-surface border-border text-text-muted"
                              )}>
                                {alert.status}
                              </span>
                              <span className="text-[10px] text-text-muted font-medium ml-1">Added {alert.time}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => setAlertToDelete(alert.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {alertToDelete === alert.id && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-xl border border-danger/30 animate-fade-in">
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-text-primary">Remove this alert?</p>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="px-3 py-1 bg-danger text-white text-[10px] font-bold rounded-lg hover:bg-danger/90"
                              >
                                Yes
                              </button>
                              <button 
                                onClick={() => setAlertToDelete(null)}
                                className="px-3 py-1 bg-surface text-text-primary text-[10px] font-bold rounded-lg border border-border hover:bg-card"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Performance" && (
            <div className="space-y-8 animate-fade-in">
              {/* Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Watchlist vs Nifty 50</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-secondary">+2.4%</span>
                        <span className="text-[10px] text-text-muted font-bold">vs +1.1%</span>
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-secondary opacity-20" />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Best Performer</p>
                      <p className="text-lg font-black text-secondary">
                        {[...stocks].sort((a, b) => b.change - a.change)[0]?.symbol.split(":")[0] || "--"}
                        <span className="text-xs font-bold ml-1">
                          {(([...stocks].sort((a, b) => b.change - a.change)[0]?.change > 0 ? "+" : "") + 
                           ([...stocks].sort((a, b) => b.change - a.change)[0]?.change.toFixed(2) || "0.00"))}%
                        </span>
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-secondary opacity-20" />
                  </CardContent>
                </Card>
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Worst Performer</p>
                      <p className="text-lg font-black text-danger">
                        {[...stocks].sort((a, b) => a.change - b.change)[0]?.symbol.split(":")[0] || "--"}
                        <span className="text-xs font-bold ml-1">
                          {([...stocks].sort((a, b) => a.change - b.change)[0]?.change.toFixed(2) || "0.00")}%
                        </span>
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-danger opacity-20" />
                  </CardContent>
                </Card>
              </div>

              {/* Performance Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Stock Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Stock</th>
                        <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg Buy Price</th>
                        <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Current Price</th>
                        <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">P&L %</th>
                        <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">vs Nifty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {stocks.map(stock => {
                        const buyPrice = buyPrices[stock.symbol];
                        const pl = buyPrice ? ((stock.price - buyPrice) / buyPrice * 100) : null;
                        const beatingNifty = pl !== null && pl > 1.1;

                        return (
                          <tr key={stock.symbol} className="group hover:bg-surface/30 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-[10px] font-black text-primary">
                                  {stock.symbol.split(":")[0].slice(0, 3)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-text-primary">{stock.symbol.split(":")[0]}</p>
                                  <p className="text-[10px] text-text-muted font-medium">{stock.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              {editingBuyPrice === stock.symbol ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    autoFocus
                                    type="text"
                                    value={tempBuyPrice}
                                    onChange={(e) => setTempBuyPrice(e.target.value)}
                                    placeholder="Price"
                                    className="bg-surface border border-primary rounded px-2 py-1 text-xs font-bold text-text-primary w-24 outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && handleUpdateBuyPrice(stock.symbol)}
                                  />
                                  <button onClick={() => handleUpdateBuyPrice(stock.symbol)} className="text-secondary hover:text-secondary/80">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingBuyPrice(stock.symbol);
                                    setTempBuyPrice(buyPrice?.toString() || "");
                                  }}
                                  className="flex items-center gap-2 text-sm font-bold text-text-primary hover:text-primary transition-colors group/edit"
                                >
                                  {buyPrice ? `₹${buyPrice.toLocaleString("en-IN")}` : "--"}
                                  <Plus className="w-3.5 h-3.5 text-text-muted group-hover/edit:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </td>
                            <td className="py-4 pr-4">
                              <p className="text-sm font-bold text-text-primary">₹{stock.price.toLocaleString("en-IN")}</p>
                            </td>
                            <td className="py-4 pr-4">
                              {pl !== null ? (
                                <p className={cn("text-sm font-black", pl >= 0 ? "text-secondary" : "text-danger")}>
                                  {pl >= 0 ? "+" : ""}{pl.toFixed(2)}%
                                </p>
                              ) : (
                                <span className="text-xs text-text-muted">Enter buy price</span>
                              )}
                            </td>
                            <td className="py-4">
                              {pl !== null ? (
                                <div className={cn(
                                  "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit",
                                  beatingNifty ? "bg-secondary/10 text-secondary" : "bg-danger/10 text-danger"
                                )}>
                                  {beatingNifty ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {beatingNifty ? "BEATING" : "LAGGING"}
                                </div>
                              ) : (
                                <span className="text-xs text-text-muted">--</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Groups" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">My groups</h2>
                <Button 
                  onClick={() => setIsCreatingGroup(true)}
                  variant="outline" 
                  size="sm" 
                  className="border-primary/30 text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New group
                </Button>
              </div>

              {isCreatingGroup && (
                <div className="flex items-center gap-2 bg-surface border border-primary rounded-xl p-3 shadow-glow animate-slide-down">
                  <Folder className="w-5 h-5 text-primary" />
                  <input 
                    autoFocus
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    placeholder="Enter group name..."
                    className="bg-transparent text-sm font-bold text-text-primary outline-none flex-1 px-2"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateGroupTab()}
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={handleCreateGroupTab} className="p-1.5 rounded-lg bg-primary text-white">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsCreatingGroup(false)} className="p-1.5 rounded-lg bg-surface border border-border text-text-muted">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {groups.length === 0 && !isCreatingGroup ? (
                <div className="py-20 text-center space-y-4">
                  <Folder className="w-16 h-16 text-text-muted opacity-10 mx-auto" />
                  <h3 className="text-xl font-bold text-text-primary">No groups yet</h3>
                  <p className="text-text-muted text-sm max-w-xs mx-auto">Groups help you organise stocks by strategy or sector for faster monitoring.</p>
                  <Button onClick={() => setIsCreatingGroup(true)} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
                    + Create your first group
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map(group => {
                    const groupStocks = stocks.filter(s => s.group === group);
                    const isExpanded = expandedGroup === group;
                    const isEditing = editingGroup === group;
                    const isDeleting = deletingGroup === group;

                    return (
                      <div key={group} className="space-y-3">
                        <Card className={cn(
                          "bg-card border-border overflow-hidden transition-all duration-300",
                          isExpanded && "ring-1 ring-primary/30 shadow-glow-primary"
                        )}>
                          <div 
                            className="p-4 cursor-pointer flex items-center justify-between"
                            onClick={() => !isEditing && !isDeleting && setExpandedGroup(isExpanded ? null : group)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <Folder className="w-5 h-5 text-primary" />
                              {isEditing ? (
                                <div className="flex items-center gap-2 flex-1 max-w-xs" onClick={e => e.stopPropagation()}>
                                  <input 
                                    autoFocus
                                    type="text"
                                    value={groupInput}
                                    onChange={(e) => setGroupInput(e.target.value)}
                                    className="bg-surface border border-primary rounded px-2 py-1 text-sm font-bold text-text-primary w-full outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && handleRenameGroup(group)}
                                  />
                                  <button onClick={() => handleRenameGroup(group)} className="text-secondary">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingGroup(null)} className="text-text-muted">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-text-primary">{group}</h4>
                                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                      {groupStocks.length} stocks
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {groupStocks.slice(0, 4).map(s => (
                                      <span key={s.symbol} className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-bold text-text-muted">
                                        {s.symbol.split(":")[0]}
                                      </span>
                                    ))}
                                    {groupStocks.length > 4 && <span className="text-[9px] text-text-muted font-bold ml-1">+{groupStocks.length - 4} more</span>}
                                  </div>
                                </div>
                              )}
                            </div>

                            {!isEditing && !isDeleting && (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => {
                                    setEditingGroup(group);
                                    setGroupInput(group);
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setDeletingGroup(group)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {isDeleting && (
                              <div className="flex flex-col items-end gap-1 animate-fade-in" onClick={e => e.stopPropagation()}>
                                <p className="text-[9px] font-bold text-danger uppercase tracking-widest text-right">Delete group? Stocks will move to Ungrouped.</p>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleDeleteGroup(group)} className="text-[10px] font-black text-danger hover:underline">YES</button>
                                  <button onClick={() => setDeletingGroup(null)} className="text-[10px] font-black text-text-muted hover:underline">CANCEL</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {isExpanded && groupStocks.length > 0 && (
                            <div className="px-4 pb-4 space-y-3 animate-slide-down">
                              <div className="h-px bg-border/50 mb-4" />
                              {groupStocks.map(stock => (
                                <StockCard key={stock.symbol} stock={stock} onRemove={handleDeleteStock} />
                              ))}
                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })}

                  {/* Ungrouped Section */}
                  {stocks.some(s => !s.group) && (
                    <div className="space-y-3 pt-6 border-t border-border/50">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <Folder className="w-4 h-4 opacity-30" />
                        <span className="text-xs font-bold uppercase tracking-widest">Ungrouped</span>
                        <span className="h-px flex-1 bg-border/30 ml-2" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stocks.filter(s => !s.group).map(stock => (
                          <StockCard key={stock.symbol} stock={stock} onRemove={handleDeleteStock} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Stock Flow Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={handleCloseAddModal} />
          <Card className="relative w-full h-full md:h-[80vh] md:max-h-[800px] md:max-w-2xl bg-card border-border shadow-2xl animate-slide-up overflow-hidden flex flex-col mx-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <button 
                onClick={() => addStockStep > 1 ? setAddStockStep(addStockStep - 1) : handleCloseAddModal()} 
                className="text-text-muted hover:text-text-primary"
              >
                {addStockStep > 1 ? <ChevronRight className="rotate-180 w-6 h-6" /> : <X className="w-6 h-6" />}
              </button>
              <h3 className="text-lg font-bold text-text-primary">
                {addStockStep === 1 ? "Add stock" : addStockStep === 2 ? "Preview" : "Added"}
              </h3>
              <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-6 border-b border-border/50">
              <div className="flex items-center justify-between max-sm mx-auto">
                {[
                  { id: 1, label: "Search" },
                  { id: 2, label: "Preview" },
                  { id: 3, label: "Added" }
                ].map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                      addStockStep === step.id ? "bg-primary/20 border-primary text-primary shadow-glow" :
                      addStockStep > step.id ? "bg-secondary/20 border-secondary text-secondary" :
                      "bg-surface border-border text-text-muted"
                    )}>
                      {addStockStep > step.id ? "✓" : step.id}
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      addStockStep === step.id ? "text-text-primary" : "text-text-muted"
                    )}>
                      {step.label}
                    </span>
                    {idx < 2 && <div className="w-8 h-[1px] bg-border mx-2" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {addStockStep === 1 && (
                <div className="space-y-8 animate-fade-in">
                  {/* Search Input */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input 
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or symbol... e.g. RELIANCE, TCS"
                      className="w-full h-14 bg-surface border border-border focus:border-primary rounded-xl pl-12 pr-12 text-text-primary placeholder:text-text-muted/50 outline-none transition-all"
                    />
                    {isSearching && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                    {searchQuery && !isSearching && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {searchQuery.trim() === "" ? (
                    /* Popular Picks */
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Popular on NSE</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_PICKS.map(chip => (
                          <button
                            key={chip}
                            onClick={() => setSearchQuery(chip)}
                            className="px-4 py-2 rounded-lg bg-surface border border-border text-sm font-bold text-text-muted hover:text-primary hover:border-primary/30 transition-all"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Search Results */
                    <div className="space-y-3">
                      {searchResults.length > 0 ? (
                        searchResults.map(result => {
                          const isInWatchlist = stocks.some(s => s.symbol === result.symbol);
                          return (
                            <div 
                              key={result.symbol}
                              className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-[9px] text-text-muted group-hover:text-primary transition-colors">
                                  {result.symbol.split(":")[0].slice(0, 3)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-text-primary text-sm">{result.name}</h4>
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{result.symbol}</span>
                                  </div>
                                  <p className="text-[9px] text-text-muted uppercase tracking-widest mt-0.5">{result.exchange} · {result.country}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <button
                                  disabled={isInWatchlist}
                                  onClick={async () => {
                                    setIsSearching(true);
                                    try {
                                      // Format symbol for international stocks (e.g., SYMBOL:NSE)
                                      const fullSymbol = result.country !== "United States" && result.exchange 
                                        ? `${result.symbol}:${result.exchange}` 
                                        : result.symbol;

                                      const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(fullSymbol)}`);
                                      if (res.ok) {
                                        const quote = await res.json();
                                        setSelectedStock({
                                          ...result,
                                          symbol: fullSymbol, // Use formatted symbol
                                          price: quote.regularMarketPrice,
                                          change: quote.regularMarketChangePercent,
                                          fullQuote: quote
                                        });
                                        setAddStockStep(2);
                                      } else {
                                        setToast(`Could not fetch data for ${result.symbol}. Please try another.`);
                                        setTimeout(() => setToast(null), 3000);
                                      }
                                    } catch (err) {
                                      console.error("Fetch quote error:", err);
                                      setToast("Error connecting to market data.");
                                      setTimeout(() => setToast(null), 3000);
                                    } finally {
                                      setIsSearching(false);
                                    }
                                  }}
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                                    isInWatchlist 
                                      ? "bg-secondary/10 border-secondary text-secondary cursor-default" 
                                      : "bg-primary text-white border-primary shadow-glow hover:scale-110 active:scale-95"
                                  )}
                                >
                                  {isInWatchlist ? "✓" : <Plus className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : !isSearching && (
                        <div className="py-10 text-center space-y-2">
                          <p className="text-text-primary font-bold">No results for &quot;{searchQuery}&quot;</p>
                          <p className="text-text-muted text-xs">Try searching for a different company or symbol</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {addStockStep === 2 && selectedStock && (
                <div className="space-y-8 animate-fade-in">
                  {/* Stock Preview Card */}
                  <div className="p-6 rounded-2xl bg-card border-2 border-primary shadow-glow-primary">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-bold text-text-primary">{selectedStock.name}</h4>
                          <span className="text-xs font-bold text-text-muted">{selectedStock.symbol}</span>
                        </div>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-bold">{selectedStock.exchange} · {selectedStock.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-text-primary tracking-tight">₹{selectedStock.price.toLocaleString("en-IN")}</p>
                        <p className={cn(
                          "text-xs font-bold",
                          selectedStock.change > 0 ? "text-secondary" : "text-danger"
                        )}>
                          {selectedStock.change > 0 ? "+" : ""}{selectedStock.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: "52W High", value: selectedStock.fullQuote?.fiftyTwoWeekHigh ? `₹${selectedStock.fullQuote.fiftyTwoWeekHigh.toLocaleString("en-IN")}` : "--" },
                        { label: "52W Low", value: selectedStock.fullQuote?.fiftyTwoWeekLow ? `₹${selectedStock.fullQuote.fiftyTwoWeekLow.toLocaleString("en-IN")}` : "--" },
                        { label: "Mkt Cap", value: selectedStock.fullQuote?.marketCap ? `₹${(selectedStock.fullQuote.marketCap / 10000000).toFixed(0)}Cr` : "--" },
                        { label: "Volume", value: selectedStock.fullQuote?.regularMarketVolume ? (selectedStock.fullQuote.regularMarketVolume / 1000000).toFixed(1) + "M" : "--" },
                        { label: "Exchange", value: selectedStock.exchange },
                        { label: "Currency", value: selectedStock.fullQuote?.currency || "INR" }
                      ].map((m, i) => (
                        <div key={i} className="bg-surface/50 border border-border/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter mb-0.5">{m.label}</p>
                          <p className="text-[11px] font-bold text-text-primary">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#12102a] border border-primary/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-text-muted italic">
                        Trade Signal will be generated once added to your watchlist.
                      </p>
                    </div>
                  </div>

                  {/* Group Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Add to group</p>
                      <span className="text-[10px] text-text-muted">(optional)</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {groups.map(group => (
                        <button
                          key={group}
                          onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold border transition-all",
                            selectedGroup === group 
                              ? "bg-primary/10 border-primary text-primary shadow-glow" 
                              : "bg-surface border-border text-text-muted hover:border-border/80"
                          )}
                        >
                          {group}
                        </button>
                      ))}
                      
                      {!isAddingGroup ? (
                        <button
                          onClick={() => setIsAddingGroup(true)}
                          className="px-4 py-2 rounded-lg text-sm font-bold border border-dashed border-border text-text-muted hover:text-text-primary transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> New group
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-surface border border-primary rounded-lg px-2 py-1 shadow-glow animate-fade-in">
                          <input 
                            autoFocus
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name"
                            className="bg-transparent text-sm font-bold text-text-primary outline-none px-2 w-28 placeholder:text-text-muted/40"
                            onKeyDown={(e) => e.key === "Enter" && handleAddNewGroup()}
                          />
                          <button 
                            onClick={handleAddNewGroup}
                            className="p-1 rounded-md bg-primary text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setIsAddingGroup(false)}
                            className="p-1 text-text-muted"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={handleConfirmAdd}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-glow rounded-xl"
                  >
                    Add to watchlist
                  </Button>
                </div>
              )}

              {addStockStep === 3 && selectedStock && (
                <div className="space-y-8 animate-fade-in flex flex-col items-center">
                  {/* Confirmation Section */}
                  <div className="text-center space-y-4 py-6">
                    <div className="w-14 h-14 rounded-full border-4 border-secondary bg-secondary/10 flex items-center justify-center mx-auto shadow-glow-secondary">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-white font-bold">✓</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-text-primary tracking-tight">{selectedStock.symbol.split(":")[0]} added!</h3>
                      <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                        {selectedGroup ? `Added to ${selectedGroup} group.` : ""} System is now analyzing this stock for live signals.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
                      <Button 
                        onClick={handleCloseAddModal}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-glow rounded-xl"
                      >
                        View in watchlist
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setAddStockStep(1)}
                        className="w-full h-12 rounded-xl border-border hover:bg-surface"
                      >
                        Add another stock
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function AlertCreateForm({
  stocks,
  form,
  setForm,
  onCreate,
  onCancel,
  isCreating,
}: {
  stocks: any[];
  form: { symbol: string; alertType: string; condition: "above" | "below"; targetPrice: string; note: string };
  setForm: React.Dispatch<React.SetStateAction<{ symbol: string; alertType: string; condition: "above" | "below"; targetPrice: string; note: string }>>;
  onCreate: () => void;
  onCancel: () => void;
  isCreating: boolean;
}) {
  const selected = stocks.find(s => s.symbol === form.symbol);
  const currentPrice = selected?.price;
  const effectiveCondition = form.alertType === "CUSTOM" ? form.condition : ALERT_TYPE_META[form.alertType].condition;

  const typeOptions = ["TARGET", "STOP_LOSS", "BUY_ZONE", "SELL_ZONE", "CUSTOM"];

  return (
    <Card className="bg-card border-primary/40 shadow-glow-primary animate-slide-down">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">New price alert</h3>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Stock</label>
          <select
            value={form.symbol}
            onChange={(e) => setForm(f => ({ ...f, symbol: e.target.value }))}
            className="w-full h-11 bg-surface border border-border focus:border-primary rounded-lg px-3 text-sm font-bold text-text-primary outline-none"
          >
            {stocks.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol.split(":")[0]}{s.price ? ` — ₹${s.price.toLocaleString("en-IN")}` : ""}
              </option>
            ))}
          </select>
          {currentPrice ? (
            <p className="text-[10px] text-text-muted">Current price: <span className="font-bold text-text-primary">₹{currentPrice.toLocaleString("en-IN")}</span></p>
          ) : null}
        </div>

        {/* Alert type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Alert type</label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(type => (
              <button
                key={type}
                onClick={() => setForm(f => ({ ...f, alertType: type }))}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  form.alertType === type
                    ? "bg-primary/10 border-primary text-primary shadow-glow"
                    : "bg-surface border-border text-text-muted hover:border-border/80"
                )}
              >
                {ALERT_TYPE_META[type].label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">
            Triggers when price goes{" "}
            <span className="font-bold text-text-primary">{effectiveCondition === "above" ? "at or above" : "at or below"}</span>{" "}
            your target.
          </p>
        </div>

        {/* Custom direction toggle */}
        {form.alertType === "CUSTOM" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm(f => ({ ...f, condition: "above" }))}
              className={cn(
                "h-9 rounded-lg text-xs font-bold border transition-all",
                form.condition === "above" ? "bg-secondary/20 border-secondary text-secondary" : "bg-surface border-border text-text-muted"
              )}
            >
              Rises above
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, condition: "below" }))}
              className={cn(
                "h-9 rounded-lg text-xs font-bold border transition-all",
                form.condition === "below" ? "bg-danger/20 border-danger text-danger" : "bg-surface border-border text-text-muted"
              )}
            >
              Falls below
            </button>
          </div>
        )}

        {/* Target price */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target price (₹)</label>
          <input
            type="number"
            value={form.targetPrice}
            onChange={(e) => setForm(f => ({ ...f, targetPrice: e.target.value }))}
            placeholder="e.g. 1450"
            className="w-full h-11 bg-surface border border-border focus:border-primary rounded-lg px-3 text-sm font-bold text-text-primary outline-none placeholder:text-text-muted/40"
          />
        </div>

        {/* Optional note */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Note (optional)</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="e.g. Add on dip"
            className="w-full h-11 bg-surface border border-border focus:border-primary rounded-lg px-3 text-sm text-text-primary outline-none placeholder:text-text-muted/40"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={onCreate}
            disabled={isCreating}
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create alert"}
          </Button>
          <Button onClick={onCancel} variant="outline" className="h-11 rounded-lg border-border hover:bg-surface">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StockCard({ stock, flagged, onRemove }: { stock: any, flagged?: boolean, onRemove?: (symbol: string) => void }) {
  const isPositive = stock.change > 0;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  return (
    <Card className={cn(
      "bg-card border-border hover:border-primary/40 hover:shadow-glow transition-all duration-300 relative overflow-hidden group",
      flagged && "border-l-4 border-l-primary"
    )}>
      {stock.isLoading && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-primary">
              {stock.symbol.split(":")[0].slice(0, 3)}
            </div>
            <div>
              <h3 className="font-bold text-text-primary leading-tight">{stock.symbol}</h3>
              <p className="text-xs text-text-muted mt-0.5">{stock.name}</p>
            </div>
          </div>

          <div className="text-right flex items-start gap-4">
            <div>
              <p className="font-bold text-text-primary">₹{stock.price ? stock.price.toLocaleString("en-IN") : "--"}</p>
              <p className={cn("text-xs font-bold mt-0.5", isPositive ? "text-secondary" : "text-danger")}>
                {isPositive ? "+" : ""}{stock.change ? stock.change.toFixed(2) : "0.00"}%
              </p>
            </div>
            
            {onRemove && (
              <div className="relative">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <button 
                      onClick={() => onRemove(stock.symbol)}
                      className="p-1 rounded bg-danger text-white hover:bg-danger/90"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setIsConfirmingDelete(false)}
                      className="p-1 rounded bg-surface border border-border text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-40 md:opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Badge className={cn(
              "text-[9px] font-black px-2 py-0.5",
              stock.verdict === "Long" ? "bg-secondary text-white" : 
              stock.verdict === "Short" ? "bg-danger text-white" : "bg-amber-500 text-white"
            )}>
              Signal: {(stock.verdict || "Wait").toUpperCase()}
            </Badge>

            <div className="flex items-center gap-3 flex-1 ml-6 max-w-[120px]">
              <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${stock.confidence || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-text-muted">{stock.confidence || 0}%</span>
            </div>

            <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary ml-2">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {stock.verdictText && (
            <p className="text-[10px] text-text-muted mt-2 italic">
              {stock.verdictText}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
