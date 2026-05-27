"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Target, ShieldCheck, Activity, LineChart, AlertTriangle, Sparkles } from "lucide-react";
import AIVerdictCard from "@/components/AIVerdictCard";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

import SimpleReportCard from "@/components/SimpleReportCard";



interface Zone {
  low: number;
  high: number;
  strength: number;
  reason: string;
}

interface AnalysisResult {
  buyZones: Zone[];
  sellZones: Zone[];
  probability?: {
    profitProb: number;
    lossProb: number;
    reasoning: string;
  };
  keyMetrics?: {
    stopLoss: number;
    target1: number;
    target2: number;
    riskReward: string;
  };
  riskMeter?: {
    riskLevel: "low" | "moderate" | "high";
    riskScore: number;
    riskNote: string;
  };
  signals?: {
    name: string;
    signal: "Bullish" | "Bearish" | "Neutral";
    detail: string;
  }[];
  verdict?: string;
  action?: "Long" | "Short" | "Wait";
}

export default function BuySellZones() {
  const searchParams = useSearchParams();
  const { analysisDays, isSimpleMode, toggleSimpleMode } = useAppStore();
  const defaultSymbol = searchParams.get("symbol") || "RELIANCE:NSE";
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update symbol if URL changes
  useEffect(() => {
    const urlSymbol = searchParams.get("symbol");
    if (urlSymbol) {
      setSymbol(urlSymbol);
    }
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("buy-sell-zones");

  const navLinks = [
    { id: "buy-sell-zones", label: "Buy & Sell Zones" },
    { id: "trade-probability", label: "Trade Probability" },
    { id: "key-metrics", label: "Key Metrics" },
    { id: "risk-meter", label: "Risk Meter" },
    { id: "technical-signals", label: "Technical Signals" },
    { id: "ai-verdict", label: "Trade Verdict" },
  ];

  // IntersectionObserver for active section tracking
  useEffect(() => {
    if (!result) return;

    const observerOptions = {
      root: null,
      rootMargin: "-100px 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    navLinks.forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [result]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAnalyze = useCallback(async (overrideSymbol?: string) => {
    const targetSymbol = overrideSymbol || symbol;
    if (!targetSymbol.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/claude/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          symbol: targetSymbol.toUpperCase(),
          days: analysisDays,
          mode: isSimpleMode ? "simple" : "expert"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch analysis");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, analysisDays, isSimpleMode]);

  // Auto-analyze when URL search param symbol changes on mount/navigation
  useEffect(() => {
    if (isMounted) {
      const urlSymbol = searchParams.get("symbol");
      if (urlSymbol) {
        setSymbol(urlSymbol);
        handleAnalyze(urlSymbol);
      }
    }
  }, [isMounted, searchParams]);

  // Auto-analyze when global range changes
  useEffect(() => {
    if (isMounted && result && !isLoading) {
      handleAnalyze();
    }
  }, [analysisDays, isSimpleMode]); // Only trigger on range or mode change

  return (
    <section id="analysis">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Market Analysis & Zones</h2>

        </div>
      </div>
      
      <Card className="border border-border bg-surface shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-text-muted mb-1.5 block">Selected Asset</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. RELIANCE:NSE or TCS:NSE"
                  className="bg-background border-border sm:max-w-xs uppercase"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isLoading || !symbol.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px] w-full sm:w-auto"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                  {isLoading ? "Analyzing..." : "Analysis"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sticky Section Nav */}
          {result && !isSimpleMode && (
            <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-surface/95 backdrop-blur-sm border-b border-border mb-6">
              <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide h-10">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={cn(
                      "text-[13px] font-bold whitespace-nowrap h-full relative transition-colors",
                      activeSection === link.id
                        ? "text-text-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {link.label}
                    {activeSection === link.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-button bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          {result && (
            <div id="buy-sell-zones" className="grid md:grid-cols-2 gap-6 animate-fade-in scroll-mt-24">
              {/* Buy Zones */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  <h3 id="buy-zones" className="text-lg font-semibold text-text-primary">
                    {isSimpleMode ? "Good Prices to Buy At" : "Buy Zones"}
                  </h3>
                </div>
                {result.buyZones && result.buyZones.length > 0 ? (
                  result.buyZones.map((zone, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 hover:border-secondary/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-secondary" />
                          <span className="font-bold text-secondary text-lg">
                            {zone.low} - {zone.high}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Strength: {zone.strength}/5
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted capitalize">Reason: {zone.reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted italic">No buy zones identified.</p>
                )}
              </div>

              {/* Sell Zones */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
                  <TrendingDown className="w-5 h-5 text-danger" />
                  <h3 id="sell-zones" className="text-lg font-semibold text-text-primary">
                    {isSimpleMode ? "Good Prices to Sell At" : "Sell Zones"}
                  </h3>
                </div>
                {result.sellZones && result.sellZones.length > 0 ? (
                  result.sellZones.map((zone, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-danger/20 bg-danger/5 hover:border-danger/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-danger" />
                          <span className="font-bold text-danger text-lg">
                            {zone.low} - {zone.high}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-[10px] bg-danger text-white">
                          Strength: {zone.strength}/5
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted capitalize">Reason: {zone.reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted italic">No sell zones identified.</p>
                )}
              </div>
            </div>
          )}

          {/* Trade Probability Analysis */}
          {result?.probability && (
            <div id="trade-probability" className="mt-8 pt-6 border-t border-border animate-fade-in scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {isSimpleMode ? "Chance of Success" : "Trade Probability (Long)"}
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="space-y-5">
                  {/* Profit Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-text-primary">Profit Probability</span>
                      <span className="text-sm font-bold text-secondary">{result.probability.profitProb}%</span>
                    </div>
                    <div className="h-2.5 bg-background border border-border rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out" style={{ width: `${result.probability.profitProb}%` }} />
                    </div>
                  </div>
                  
                  {/* Loss Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-text-primary">Loss Probability</span>
                      <span className="text-sm font-bold text-danger">{result.probability.lossProb}%</span>
                    </div>
                    <div className="h-2.5 bg-background border border-border rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-danger rounded-full transition-all duration-1000 ease-out" style={{ width: `${result.probability.lossProb}%` }} />
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-text-primary font-medium mb-1">Analysis Reasoning:</p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {result.probability.reasoning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {result?.keyMetrics && (
            <div id="key-metrics" className="mt-8 pt-6 border-t border-border animate-fade-in scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {isSimpleMode ? "Important Numbers" : "Key Levels & Metrics"}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5">
                  <p className="text-xs font-medium text-text-muted mb-1">
                    {isSimpleMode ? "Risk vs Reward" : "Risk / Reward"}
                  </p>
                  <p className="text-xl font-bold text-secondary">{result.keyMetrics.riskReward}</p>
                </div>
                <div className="p-4 rounded-xl border border-danger/20 bg-danger/5">
                  <p className="text-xs font-medium text-text-muted mb-1">
                    {isSimpleMode ? "Sell if it Drops To" : "Stop Loss"}
                  </p>
                  <p className="text-xl font-bold text-danger">{result.keyMetrics.stopLoss}</p>
                </div>
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5">
                  <p className="text-xs font-medium text-text-muted mb-1">
                    {isSimpleMode ? "Aim For" : "Target 1"}
                  </p>
                  <p className="text-xl font-bold text-secondary">{result.keyMetrics.target1}</p>
                </div>
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5">
                  <p className="text-xs font-medium text-text-muted mb-1">
                    {isSimpleMode ? "Maybe Even" : "Target 2"}
                  </p>
                  <p className="text-xl font-bold text-secondary">{result.keyMetrics.target2}</p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Meter */}
          {result?.riskMeter && (
            <div id="risk-meter" className="mt-8 pt-6 border-t border-border animate-fade-in scroll-mt-24">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {isSimpleMode ? "Risk Level" : "Risk Meter"}
                </h3>
                <Badge variant={result.riskMeter.riskLevel === "low" ? "success" : result.riskMeter.riskLevel === "high" ? "destructive" : "warning"} className="ml-2 uppercase text-[10px]">
                  {result.riskMeter.riskLevel} Risk
                </Badge>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Gradient Bar */}
                <div className="relative h-4 rounded-full bg-gradient-to-r from-success via-warning to-destructive shadow-inner border border-border">
                  {/* Needle */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-lg transition-all duration-1000 ease-out z-10 border border-black/10"
                    style={{ left: `calc(${result.riskMeter.riskScore}% - 2px)` }}
                  />
                  {/* Needle Marker Triangle */}
                  <div 
                    className="absolute -top-3 w-3 h-3 bg-white rotate-45 border-t border-l border-black/10 transition-all duration-1000 ease-out shadow-sm"
                    style={{ left: `calc(${result.riskMeter.riskScore}% - 6px)` }}
                  />
                </div>
                
                {/* Labels */}
                <div className="flex justify-between text-xs font-semibold text-text-muted px-1">
                  <span>Low Risk</span>
                  <span>Medium Risk</span>
                  <span>High Risk</span>
                </div>

                {/* Risk Note */}
                <div className="mt-6 flex items-start gap-3 bg-warning/10 border border-warning/20 p-4 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning mb-1">Risk Assessment</p>
                    <p className="text-sm text-warning/90 leading-relaxed">
                      {result.riskMeter.riskNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Signals */}
          {result?.signals && result.signals.length > 0 && (
            <div id="technical-signals" className="mt-8 pt-6 border-t border-border animate-fade-in scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {isSimpleMode ? "What the Charts Say" : "Technical Signals"}
                </h3>
              </div>
              <div className="space-y-3">
                {result.signals.map((sig, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-xl border border-border bg-background hover:border-primary/20 transition-colors">
                    <span className="text-sm font-medium text-text-primary">{sig.name}</span>
                    <Badge 
                      variant={sig.signal === "Bullish" ? "success" : sig.signal === "Bearish" ? "destructive" : "secondary"}
                      className="text-xs py-1 h-auto text-left sm:text-center whitespace-normal sm:whitespace-nowrap"
                    >
                      {sig.signal} • {sig.detail}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Trade Verdict - The Highlighted Final Conclusion */}
          {result?.verdict && result.action && (
            <div id="ai-verdict" className="mt-10 scroll-mt-24">
              {isSimpleMode ? (
                <SimpleReportCard 
                  symbol={symbol}
                  action={result.action as "Long" | "Short" | "Wait"}
                  verdict={result.verdict}
                  stopLoss={result.keyMetrics?.stopLoss}
                  target={result.keyMetrics?.target1}
                />
              ) : (
                <AIVerdictCard 
                  verdict={result.verdict} 
                  action={result.action as "Long" | "Short" | "Wait"} 
                />
              )}
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-xl px-10 text-center">
              <p className="text-sm text-text-muted leading-relaxed">
                Click &quot;Analysis&quot; to generate data-driven Buy and Sell zones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
