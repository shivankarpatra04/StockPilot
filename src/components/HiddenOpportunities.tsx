"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gem, TrendingUp, Zap, ArrowDownCircle, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import DashboardSectionHeader from "@/components/DashboardSectionHeader";

interface Opportunity {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  score: number;
  change: number;
  rsi: number;
  support: number;
  target: number;
  stopLoss: number;
  reasoning: string;
  type: string;
}

interface OpportunitiesData {
  strongBuys: Opportunity[];
  oversold: Opportunity[];
  momentum: Opportunity[];
  hiddenGems: Opportunity[];
  totalAnalyzed: number;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  "Strong Buy": { icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  "Oversold Bounce": { icon: ArrowDownCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Momentum Play": { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "Hidden Gem": { icon: Gem, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const config = TYPE_CONFIG[opp.type] || TYPE_CONFIG["Strong Buy"];
  const Icon = config.icon;
  const isPositive = opp.change >= 0;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 hover:scale-[1.01] transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.bg} border ${config.border}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <div className="font-bold text-text-primary text-sm">{opp.symbol.split(":")[0]}</div>
            <div className="text-[10px] text-text-muted truncate max-w-[100px]">{opp.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold text-text-primary">₹{opp.price?.toFixed(2)}</div>
          <div className={`text-[10px] font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{opp.change?.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 font-bold ${config.color} border-current`}>
          {opp.type}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 text-text-muted">
          {opp.sector}
        </Badge>
      </div>

      <p className="text-[10px] text-text-muted leading-relaxed mb-3 line-clamp-2">{opp.reasoning}</p>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="text-center p-1.5 bg-background/40 rounded-lg">
          <div className="text-[8px] text-text-muted font-semibold">SCORE</div>
          <div className={`text-xs font-black ${config.color}`}>{opp.score}%</div>
        </div>
        <div className="text-center p-1.5 bg-background/40 rounded-lg">
          <div className="text-[8px] text-text-muted font-semibold">RSI</div>
          <div className="text-xs font-black text-text-primary">{opp.rsi}</div>
        </div>
        <div className="text-center p-1.5 bg-background/40 rounded-lg">
          <div className="text-[8px] text-green-400 font-semibold">TARGET</div>
          <div className="text-xs font-black text-green-400">₹{opp.target}</div>
        </div>
      </div>

      <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(opp.symbol)}`}>
        <Button variant="ghost" size="sm" className={`w-full h-7 text-[10px] font-bold ${config.color} hover:${config.bg}`}>
          Analyze <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

export default function HiddenOpportunities() {
  const { analysisDays } = useAppStore();
  const [data, setData] = useState<OpportunitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"strongBuys" | "oversold" | "momentum" | "hiddenGems">("hiddenGems");

  useEffect(() => {
    async function fetchOpps() {
      setLoading(true);
      try {
        const res = await fetch(`/api/opportunities?days=${analysisDays}`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error("Failed to fetch opportunities", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOpps();
  }, [analysisDays]);

  const tabs: { key: typeof activeTab; label: string; icon: any; color: string }[] = [
    { key: "hiddenGems", label: "Hidden Gems", icon: Gem, color: "text-purple-400" },
    { key: "strongBuys", label: "Strong Buys", icon: TrendingUp, color: "text-green-400" },
    { key: "oversold", label: "Oversold", icon: ArrowDownCircle, color: "text-blue-400" },
    { key: "momentum", label: "Momentum", icon: Zap, color: "text-yellow-400" },
  ];

  const currentList = data ? data[activeTab] : [];

  return (
    <section className="space-y-5">
      <DashboardSectionHeader
        number="05"
        title="Hidden Opportunities"
        subtitle={data ? `Structural breakouts and setups analyzed from ${data.totalAnalyzed} Nifty 500 stocks (${analysisDays}D timeframe).` : "Algorithmic breakouts, swings, and oversold bounce setups."}
        icon={<Gem className="w-5 h-5 text-purple-400" />}
      />

      {/* Tab Selector */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? `bg-surface border border-border/80 ${tab.color}`
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {data && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background text-[9px]">
                  {data[tab.key].length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-text-muted">Scanning {analysisDays}D opportunities...</span>
        </div>
      ) : currentList.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="p-8 text-center text-text-muted text-sm">
            No {activeTab === "hiddenGems" ? "hidden gems" : activeTab} found for the {analysisDays}D range.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentList.map(opp => (
            <OpportunityCard key={opp.symbol} opp={opp} />
          ))}
        </div>
      )}
    </section>
  );
}
