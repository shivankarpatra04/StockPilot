"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import EarningsCatalystPlays from "@/components/EarningsCatalystPlays";
import SectorCatchUpTrades from "@/components/SectorCatchUpTrades";
import SwingTradeSetups from "@/components/SwingTradeSetups";
import TechnicalBreakouts from "@/components/TechnicalBreakouts";
import { useAppStore } from "@/store/useAppStore";
import {
  Lightbulb,
  Loader2,
  Calendar,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatScanAge } from "@/lib/format-scan-age";

const TABS = [
  {
    id: "earnings",
    label: "Earnings Catalysts",
    shortLabel: "Earnings",
    icon: Calendar,
    color: "amber",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/30",
    activeBg: "bg-amber-400",
    description: "High-volatility plays around quarterly reports",
    badge: "1–3 day horizon",
  },
  {
    id: "breakouts",
    label: "Technical Breakouts",
    shortLabel: "Breakouts",
    icon: Activity,
    color: "violet",
    colorClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
    borderClass: "border-violet-400/30",
    activeBg: "bg-violet-400",
    description: "Stocks clearing key resistance on surge volume",
    badge: "3–14 day horizon",
  },
  {
    id: "swing",
    label: "Swing Setups",
    shortLabel: "Swing",
    icon: TrendingUp,
    color: "emerald",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    borderClass: "border-emerald-400/30",
    activeBg: "bg-emerald-400",
    description: "Quality stocks at technical discounts",
    badge: "2–4 week horizon",
  },
  {
    id: "catchup",
    label: "Sector Catch-Up",
    shortLabel: "Catch-Up",
    icon: Layers,
    color: "sky",
    colorClass: "text-sky-400",
    bgClass: "bg-sky-400/10",
    borderClass: "border-sky-400/30",
    activeBg: "bg-sky-400",
    description: "Sector leaders, one stock still lagging",
    badge: "1–12 week horizon",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OpportunitiesContent />
    </Suspense>
  );
}

function OpportunitiesContent() {
  const { analysisDays, isSimpleMode, setAnalysisDays } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab") as TabId | null;
  const initRef = useRef(false);

  // Locked highlight: when the user arrives via a Best Trade badge with
  // ?highlight=SYMBOL, we pin that stock with the ⭐ banner. As soon as the
  // user switches timeframe inline, this lock drops and the dynamic
  // best-of-current-timeframe takes over (so 60D shows SUNTV, 15D shows
  // whoever is #1 at 15D, 90D shows the 90D pick, etc.).
  const [lockedHighlight, setLockedHighlight] = useState<string | null>(null);

  // The current-timeframe #1 pick — same source as the dashboard Best Trade card.
  const [dynamicBestSymbol, setDynamicBestSymbol] = useState<string | null>(null);

  // Apply URL params once on mount, then strip them so they can't clobber
  // future user interactions with the inline selector.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const hl = searchParams.get("highlight");
    const dp = searchParams.get("days");
    let stripUrl = false;

    if (hl) {
      setLockedHighlight(hl);
      stripUrl = true;
    }
    if (dp) {
      const parsed = parseInt(dp, 10);
      if (Number.isFinite(parsed) && [1, 7, 15, 30, 60, 90].includes(parsed)) {
        if (parsed !== analysisDays) setAnalysisDays(parsed);
        stripUrl = true;
      }
    }

    if (stripUrl) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("days");
      next.delete("highlight");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some(t => t.id === tabParam) ? tabParam : "earnings"
  );

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    async function fetchOpps() {
      setLoading(true);
      try {
        const res = await fetch(`/api/opportunities?days=${analysisDays}`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error("Failed to fetch dynamic opportunities", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOpps();
  }, [analysisDays]);

  // Fetch the #1 pick for the current timeframe (same API the dashboard uses)
  // so the ⭐ banner follows the timeframe when the lock is dropped.
  useEffect(() => {
    let cancelled = false;
    async function fetchBest() {
      try {
        const res = await fetch("/api/best-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: analysisDays }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setDynamicBestSymbol(json?.bestTrade?.symbol ?? null);
      } catch {
        /* non-fatal */
      }
    }
    fetchBest();
    return () => { cancelled = true; };
  }, [analysisDays]);

  // Inline selector handler — switching the timeframe means the URL lock no
  // longer represents user intent. Drop it so the dynamic pick takes over.
  const handleTimeframeChange = (d: number) => {
    setLockedHighlight(null);
    setAnalysisDays(d);
  };

  const highlightSymbol = lockedHighlight ?? dynamicBestSymbol;


  return (
    <div className="space-y-0 animate-fade-in">
      {/* ── Command-Center Header ───────────────────────────── */}
      <div className="relative mb-6 rounded-2xl overflow-hidden border border-border/60 bg-gradient-to-br from-[#0E0E1A] via-[#12121F] to-[#0A0A14]">
        {/* Decorative glows */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400">
                AI Market Intelligence
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              {isSimpleMode ? "Find Your Next Trade" : "Market Opportunities"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              {isSimpleMode
                ? "Curated, ready-to-act trade ideas — no research needed."
                : "Four distinct playbooks surfaced by systematic momentum analysis."}
            </p>
          </div>

          {/* Live stats strip */}
          <div className="flex items-center gap-2 sm:gap-3 sm:shrink-0 flex-wrap">
            <TimeframeSelector
              value={analysisDays}
              onChange={handleTimeframeChange}
            />
            <StatPill
              icon={<Clock className="w-3.5 h-3.5 text-violet-400" />}
              label="Data"
              value={formatScanAge(data?.dataAsOf)}
              color="violet"
            />
          </div>
        </div>

        {/* Tab Navigation — mounted inside the header card */}
        <div className="relative border-t border-border/40 px-2 sm:px-6 pb-0">
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap transition-all duration-200 border-b-2 focus:outline-none",
                    isActive
                      ? `${tab.colorClass} border-current`
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 shrink-0",
                      isActive
                        ? `${tab.bgClass} ${tab.borderClass} border`
                        : "bg-transparent"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {isActive && (
                    <span
                      className={cn(
                        "hidden md:inline text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ml-1",
                        tab.bgClass,
                        tab.colorClass
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* ── Tab Panels ──────────────────────────────────────── */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Lightbulb className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-slate-500 font-medium animate-pulse">
              Scanning market signals…
            </p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === "earnings" && (
              <EarningsCatalystPlays
                analysisDays={analysisDays}
                isSimpleMode={isSimpleMode}
                dynamicData={data?.earningsPlays}
                activeEarnings={data?.activeEarnings}
                loading={false}
                highlightSymbol={highlightSymbol}
              />
            )}
            {activeTab === "breakouts" && (
              <TechnicalBreakouts
                analysisDays={analysisDays}
                isSimpleMode={isSimpleMode}
                dynamicData={data?.breakoutPlays}
                activeBreakouts={data?.activeBreakouts}
                loading={false}
                highlightSymbol={highlightSymbol}
              />
            )}
            {activeTab === "swing" && (
              <SwingTradeSetups
                analysisDays={analysisDays}
                isSimpleMode={isSimpleMode}
                dynamicData={data?.swingTrades}
                activeSwings={data?.activeSwings}
                loading={false}
                highlightSymbol={highlightSymbol}
              />
            )}
            {activeTab === "catchup" && (
              <SectorCatchUpTrades
                analysisDays={analysisDays}
                isSimpleMode={isSimpleMode}
                dynamicData={data?.sectorTrades}
                activeCatchups={data?.activeCatchups}
                loading={false}
                highlightSymbol={highlightSymbol}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────
const TIMEFRAME_OPTIONS = [1, 7, 15, 30, 60, 90] as const;

function TimeframeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl border border-amber-500/20 bg-amber-500/8">
      <Clock className="w-3.5 h-3.5 text-amber-400 mx-1.5" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
        Range
      </span>
      {TIMEFRAME_OPTIONS.map((d) => {
        const isActive = d === value;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              "px-2 py-1 rounded-md text-[11px] font-black transition-all duration-150",
              isActive
                ? "bg-amber-400 text-black shadow-sm"
                : "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            {d}D
          </button>
        );
      })}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "amber" | "violet" | "emerald";
}) {
  const colorMap = {
    amber: "border-amber-500/20 bg-amber-500/8",
    violet: "border-violet-500/20 bg-violet-500/8",
    emerald: "border-emerald-500/20 bg-emerald-500/8",
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold",
        colorMap[color]
      )}
    >
      {icon}
      <span className="text-slate-500 font-medium hidden sm:inline">
        {label}:
      </span>
      <span className="text-white">{value}</span>
    </div>
  );
}
