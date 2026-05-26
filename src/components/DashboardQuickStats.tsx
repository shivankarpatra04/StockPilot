// filepath: src/components/DashboardQuickStats.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatScanAge } from "@/lib/format-scan-age";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Lightbulb,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type Sentiment = "Bullish" | "Bearish" | "Neutral";

interface QuickStats {
  sentiment: Sentiment;
  gainers: number;
  losers: number;
  total: number;
  bestSymbol: string | null;
  bestName: string | null;
  bestScore: number | null;
  opportunities: number;
  dataAsOf: number | null;
}

export default function DashboardQuickStats() {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [marketRes, bestRes, oppsRes] = await Promise.all([
          fetch(`/api/market-stats?days=${analysisDays}`).catch(() => null),
          fetch("/api/best-trade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ days: analysisDays }),
          }).catch(() => null),
          fetch(`/api/opportunities?days=${analysisDays}`).catch(() => null),
        ]);

        const market = marketRes?.ok ? await marketRes.json() : null;
        const best = bestRes?.ok ? await bestRes.json() : null;
        const opps = oppsRes?.ok ? await oppsRes.json() : null;

        const oppCount =
          (opps?.earningsPlays?.length ?? 0) +
          (opps?.breakoutPlays?.length ?? 0) +
          (opps?.swingTrades?.length ?? 0) +
          (opps?.sectorTrades?.length ?? 0);

        if (cancelled) return;
        setStats({
          sentiment: (market?.sentiment as Sentiment) ?? "Neutral",
          gainers: market?.gainers ?? 0,
          losers: market?.losers ?? 0,
          total:
            (market?.gainers ?? 0) +
            (market?.losers ?? 0) +
            (market?.unchanged ?? 0),
          bestSymbol: best?.bestTrade?.symbol ?? null,
          bestName:
            best?.bestTrade?.shortName ??
            best?.bestTrade?.symbol?.split(":")[0] ??
            null,
          bestScore: best?.bestTrade?.score ?? null,
          opportunities: oppCount,
          dataAsOf: opps?.dataAsOf ?? best?.dataAsOf ?? null,
        });
      } catch {
        /* non-fatal */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [analysisDays]);

  const sentimentMeta = (() => {
    const s = stats?.sentiment ?? "Neutral";
    if (s === "Bullish")
      return {
        Icon: TrendingUp,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
        label: isSimpleMode ? "Market is UP" : "Bullish",
      };
    if (s === "Bearish")
      return {
        Icon: TrendingDown,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-400",
        label: isSimpleMode ? "Market is DOWN" : "Bearish",
      };
    return {
      Icon: Minus,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      dot: "bg-amber-400",
      label: isSimpleMode ? "Mixed market" : "Neutral",
    };
  })();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Sentiment */}
      <StatCard
        loading={loading}
        accent={sentimentMeta.border}
        bg={sentimentMeta.bg}
        icon={<sentimentMeta.Icon className={`w-4 h-4 ${sentimentMeta.color}`} />}
        label="Market Mood"
        value={
          <span className={`flex items-center gap-2 ${sentimentMeta.color}`}>
            <span className={`relative flex h-2 w-2`}>
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sentimentMeta.dot} opacity-60`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${sentimentMeta.dot}`}
              />
            </span>
            {sentimentMeta.label}
          </span>
        }
        sub={
          stats
            ? `${stats.gainers} up · ${stats.losers} down`
            : "Scanning market…"
        }
      />

      {/* Best Pick */}
      <StatCard
        loading={loading}
        accent="border-primary/30"
        bg="bg-primary/10"
        icon={<Trophy className="w-4 h-4 text-primary" />}
        label={isSimpleMode ? "Today's Top Pick" : "Best Trade"}
        value={
          stats?.bestSymbol ? (
            <Link
              href={`/dashboard/analysis?symbol=${encodeURIComponent(
                stats.bestSymbol
              )}`}
              className="text-primary hover:underline flex items-center gap-1"
            >
              {stats.bestName}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="text-text-muted">—</span>
          )
        }
        sub={
          stats?.bestScore != null
            ? `Buy score ${stats.bestScore}%`
            : "Loading pick…"
        }
      />

      {/* Opportunities */}
      <StatCard
        loading={loading}
        accent="border-violet-500/30"
        bg="bg-violet-500/10"
        icon={<Lightbulb className="w-4 h-4 text-violet-400" />}
        label={isSimpleMode ? "Trade Ideas" : "Open Opportunities"}
        value={
          <Link
            href="/dashboard/opportunities"
            className="text-violet-300 hover:underline flex items-center gap-1"
          >
            {stats?.opportunities ?? 0}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        sub={
          isSimpleMode
            ? "ready-to-act signals"
            : "across all 4 playbooks"
        }
      />

      {/* Data freshness */}
      <StatCard
        loading={loading}
        accent="border-sky-500/30"
        bg="bg-sky-500/10"
        icon={<Clock className="w-4 h-4 text-sky-400" />}
        label="Data Freshness"
        value={
          <span className="text-sky-300">
            {formatScanAge(stats?.dataAsOf ?? undefined)}
          </span>
        }
        sub={`${analysisDays}D timeframe`}
      />
    </div>
  );
}

function StatCard({
  loading,
  accent,
  bg,
  icon,
  label,
  value,
  sub,
}: {
  loading: boolean;
  accent: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div
      className={`relative rounded-xl border ${accent} bg-surface/60 backdrop-blur-sm p-3.5 overflow-hidden group hover:bg-surface/80 transition-all`}
    >
      <div className={`absolute inset-0 ${bg} opacity-40 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-card/60 border border-border/60 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
            {label}
          </span>
        </div>
        <div className="text-base font-extrabold leading-tight min-h-[24px]">
          {loading ? (
            <span className="inline-block h-4 w-20 bg-border/40 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        <p className="text-[10px] text-text-muted mt-1 font-medium truncate">
          {sub}
        </p>
      </div>
    </div>
  );
}
