"use client";

import { 
  Brain, 
  Target, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Search, 
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Lightbulb,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AiHowItWorksPage() {
  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-2">
          <Brain className="w-3.5 h-3.5" /> Core Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
          How <span className="text-primary shadow-glow-primary">StockPilot</span> Thinks
        </h1>
        <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
          Our algorithm doesn't just guess. It combines quantitative data, technical analysis, 
          and generative intelligence to predict market behavior with high precision.
        </p>
      </div>

      {/* 3 Pillars of Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Activity className="w-6 h-6 text-primary" />,
            title: "Data Ingestion",
            desc: "The system pulls 30-60 days of OHLCV (Open, High, Low, Close, Volume) data for every stock you track."
          },
          {
            icon: <Layers className="w-6 h-6 text-secondary" />,
            title: "Pattern Recognition",
            desc: "It identifies Demand Blocks, Support/Resistance levels, and Volatility clusters using SMC principles."
          },
          {
            icon: <Target className="w-6 h-6 text-amber-500" />,
            title: "Decision Logic",
            desc: "Claude 3.5 Sonnet synthesizes these patterns into a human-readable verdict and actionable trade zones."
          }
        ].map((pillar, i) => (
          <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{pillar.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{pillar.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deep Dive: Probability of Profit */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-secondary" />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Understanding "Probability of Profit"</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-text-muted leading-relaxed">
              Every trade signal comes with a percentage (e.g., 75%). This is the system's calculation of the 
              <strong> Risk-to-Reward ratio</strong> combined with technical momentum.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-primary">01</span>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Statistical Edge</h4>
                  <p className="text-xs text-text-muted">The algorithm compares the current price to historical demand zones to see if the upside is larger than the downside risk.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-primary">02</span>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Confidence Threshold</h4>
                  <p className="text-xs text-text-muted">Anything above 70% is flagged as "High Confidence". If the score is 40-60%, it suggests a sideways or high-risk market.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8 rounded-3xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-primary uppercase tracking-widest">Live Example</span>
                <Badge className="bg-secondary text-white font-bold">82% Success Prob.</Badge>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                  <div className="h-full w-[82%] bg-secondary shadow-glow-secondary animate-pulse" />
                </div>
                <p className="text-[10px] text-text-muted font-bold uppercase text-right">Confidence Level: EXTREME</p>
              </div>
              <p className="text-sm italic text-text-primary font-medium">
                "Technical setup shows a strong bounce from the ₹1,240 demand block with increasing volume. 
                Risk-Reward is 1:3.4."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buy & Sell Zones */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Buy & Sell Zones</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50 border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-secondary flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Buy Zone (Demand)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted leading-relaxed">
                The area where "Big Players" or Institutional investors previously bought heavily. 
                Our system identifies these regions to tell you when a stock is on sale.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50 border-l-4 border-l-danger">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-danger flex items-center gap-2">
                <TrendingUp className="w-5 h-5 rotate-180" /> Sell Zone (Supply)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted leading-relaxed">
                The area where the stock previously faced rejection. These are zones where you should 
                look to book profits or avoid buying as sellers are likely to enter.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trade Verdicts */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">The Three Verdicts</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Long", color: "bg-secondary", text: "Strong momentum and clear support. High chance of price moving towards Target 1." },
            { label: "Short", color: "bg-danger", text: "Overbought conditions or broken support. Likely to fall towards the next Demand Block." },
            { label: "Wait", color: "bg-amber-500", text: "No clear direction. Market is in consolidation or high volatility. Stay on the sidelines." }
          ].map((v, i) => (
            <div key={i} className="p-5 rounded-2xl bg-surface border border-border space-y-3">
              <Badge className={v.color + " text-white font-black"}>{v.label}</Badge>
              <p className="text-xs text-text-muted font-medium leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / Footer Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text-primary">Ready to trade with data?</h3>
          <p className="text-sm text-text-muted">Head back to your watchlist to see these principles in action.</p>
        </div>
        <a href="/dashboard/watchlist" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-glow hover:scale-105 transition-all">
          Go to Watchlist
        </a>
      </div>
    </div>
  );
}
