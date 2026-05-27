"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  X,
  Search,
  SlidersHorizontal,
  ChevronRight,
  LayoutGrid,
  Rows3,
  ArrowUpDown,
  TrendingUp,
  Gauge,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import DashboardSectionHeader from "@/components/DashboardSectionHeader";

import { SECTOR_LIST } from "@/lib/nifty500";

const SIGNAL_FILTERS = [
  { label: "All", variant: "default" },
  { label: "Strong Buy", variant: "success" },
  { label: "Strong Fundamentals", variant: "default" },
  { label: "Low P/E", variant: "success" },
  { label: "High Volume", variant: "warning" },
  { label: "Oversold", variant: "destructive" },
  { label: "52-Week High", variant: "secondary" },
];

type SortKey = "score" | "change" | "price" | "symbol";
type ViewMode = "grid" | "table";

function getLogoInfo(symbol: string, sector: string) {
  const sym = symbol.split(":")[0];
  const sectorColors: Record<string, { bg: string; color: string }> = {
    "Banking": { bg: "bg-blue-500/20", color: "text-blue-400" },
    "IT": { bg: "bg-cyan-500/20", color: "text-cyan-400" },
    "Energy": { bg: "bg-orange-500/20", color: "text-orange-400" },
    "Pharma": { bg: "bg-green-500/20", color: "text-green-400" },
    "FMCG": { bg: "bg-pink-500/20", color: "text-pink-400" },
    "Auto": { bg: "bg-red-500/20", color: "text-red-400" },
    "Infrastructure": { bg: "bg-stone-500/20", color: "text-stone-400" },
    "Metals": { bg: "bg-zinc-500/20", color: "text-zinc-400" },
    "Finance": { bg: "bg-indigo-500/20", color: "text-indigo-400" },
    "Power": { bg: "bg-yellow-500/20", color: "text-yellow-400" },
  };
  const c = sectorColors[sector] || { bg: "bg-primary/20", color: "text-primary" };
  return { logo: sym.slice(0, 3), ...c };
}

export default function AIStockScreener() {
  const { analysisDays, isSimpleMode } = useAppStore();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSectors, setActiveSectors] = useState<string[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [minScore, setMinScore] = useState(0);

  const handleToggleFilter = (filter: string) => {
    if (filter === "All") setActiveFilters([]);
    else
      setActiveFilters(prev =>
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
      );
  };

  const handleToggleSector = (sector: string) => {
    if (sector === "All") setActiveSectors([]);
    else
      setActiveSectors(prev =>
        prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
      );
  };

  const handleResetAll = () => {
    setActiveFilters([]);
    setActiveSectors([]);
    setSearch("");
    setMinScore(0);
  };

  useEffect(() => { setIsMounted(true); }, []);

  const serializedFilters = activeFilters.join(",");
  const serializedSectors = activeSectors.join(",");

  useEffect(() => {
    if (!isMounted) return;
    setVisibleCount(12);
    async function fetchScreenerData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ days: String(analysisDays) });
        params.set("sector", activeSectors.length > 0 ? activeSectors.join(",") : "All");
        params.set("filter", activeFilters.length > 0 ? activeFilters.join(",") : "All");

        const res = await fetch(`/api/screener?${params}`);
        if (!res.ok) throw new Error("Failed to fetch screener data");
        const data = await res.json();
        setStocks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Screener fetch error:", err);
        setStocks([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchScreenerData();
  }, [isMounted, analysisDays, serializedFilters, serializedSectors]);

  const filteredStocks = useMemo(() => {
    let out = stocks;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        (s.shortName || "").toLowerCase().includes(q)
      );
    }
    if (minScore > 0) out = out.filter(s => (s.buyScore ?? 0) >= minScore);
    return out;
  }, [stocks, search, minScore]);

  const sortedStocks = useMemo(() => {
    const arr = [...filteredStocks];
    arr.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === "string" || typeof vb === "string") {
        const sa = String(va);
        const sb = String(vb);
        return sortDesc ? sb.localeCompare(sa) : sa.localeCompare(sb);
      }
      return sortDesc ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });
    return arr;
  }, [filteredStocks, sortKey, sortDesc]);

  const paginated = sortedStocks.slice(0, visibleCount);
  const hasMore = paginated.length < sortedStocks.length;

  // Summary stats over current filtered set
  const summary = useMemo(() => {
    if (filteredStocks.length === 0)
      return { avgScore: 0, strongBuys: 0, gainers: 0, losers: 0 };
    let totalScore = 0;
    let strongBuys = 0;
    let gainers = 0;
    let losers = 0;
    for (const s of filteredStocks) {
      totalScore += s.buyScore ?? 0;
      if ((s.buyScore ?? 0) >= 70) strongBuys += 1;
      if ((s.regularMarketChangePercent ?? 0) > 0) gainers += 1;
      else if ((s.regularMarketChangePercent ?? 0) < 0) losers += 1;
    }
    return {
      avgScore: Math.round(totalScore / filteredStocks.length),
      strongBuys,
      gainers,
      losers,
    };
  }, [filteredStocks]);

  const activeFilterCount =
    activeFilters.length + activeSectors.length + (minScore > 0 ? 1 : 0) + (search ? 1 : 0);

  const sectors = ["All", ...SECTOR_LIST];

  return (
    <section className="space-y-5">
      <DashboardSectionHeader
        number="07"
        title="Nifty 500 Stock Screener"
        subtitle={
          !isLoading
            ? isSimpleMode
              ? `Showing ${filteredStocks.length} stocks matching your filters. Click any card for full analysis.`
              : `High-performance filters across ${filteredStocks.length} Nifty 500 assets.`
            : "Perform quick multi-metric filtering across the Nifty 500 pool."
        }
        icon={<SlidersHorizontal className="w-5 h-5 text-primary" />}
        badge={
          activeFilterCount > 0 ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-primary uppercase tracking-wider">
              {activeFilterCount} active
            </span>
          ) : null
        }
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search ticker or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 w-full sm:w-48 transition-all duration-300 sm:focus:w-64"
              />
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-lg px-1.5 py-1">
              <ArrowUpDown className="w-3 h-3 text-text-muted" />
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-[11px] font-bold text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="score">Buy Score</option>
                <option value="change">% Change</option>
                <option value="price">Price</option>
                <option value="symbol">Symbol</option>
              </select>
              <button
                onClick={() => setSortDesc(d => !d)}
                className="text-[10px] font-black text-primary hover:bg-primary/10 px-1 rounded"
                title={sortDesc ? "Descending" : "Ascending"}
              >
                {sortDesc ? "↓" : "↑"}
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-primary/15 text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-all ${
                  viewMode === "table"
                    ? "bg-primary/15 text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
                title="Table view"
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`text-xs h-8 gap-1.5 transition-all duration-200 ${
                showFilters ? "border-primary text-primary bg-primary/10" : ""
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 text-[10px] bg-primary text-black px-1.5 rounded font-black">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                className="text-[11px] h-8 gap-1 text-text-muted hover:text-red-400"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            )}
          </div>
        }
      />

      {/* ── Summary mini-bar ── */}
      {!isLoading && stocks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MiniStat
            icon={<Gauge className="w-3.5 h-3.5 text-primary" />}
            label="Avg Buy Score"
            value={`${summary.avgScore}%`}
            tone="primary"
          />
          <MiniStat
            icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
            label="Strong Buys (≥70)"
            value={String(summary.strongBuys)}
            tone="emerald"
          />
          <MiniStat
            icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />}
            label={`Gainers · ${analysisDays}D`}
            value={String(summary.gainers)}
            tone="green"
          />
          <MiniStat
            icon={<TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180" />}
            label={`Losers · ${analysisDays}D`}
            value={String(summary.losers)}
            tone="red"
          />
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">
            Filters:
          </span>
          {search && (
            <Chip onRemove={() => setSearch("")}>Search: “{search}”</Chip>
          )}
          {minScore > 0 && (
            <Chip onRemove={() => setMinScore(0)}>Score ≥ {minScore}%</Chip>
          )}
          {activeFilters.map(f => (
            <Chip key={f} onRemove={() => handleToggleFilter(f)}>{f}</Chip>
          ))}
          {activeSectors.map(s => (
            <Chip key={s} onRemove={() => handleToggleSector(s)}>{s}</Chip>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-surface border border-border space-y-4 animate-fade-in">
          {/* Min score slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Minimum Buy Score
              </p>
              <span className="text-xs font-black text-primary">
                {minScore === 0 ? "Any" : `≥ ${minScore}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[9px] text-text-muted/70 font-bold mt-1">
              <span>Any</span><span>30</span><span>50</span><span>70</span><span>90+</span>
            </div>
          </div>

          {/* Signal Filters */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Signal Type</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeFilters.length === 0 ? "default" : "outline"}
                className="cursor-pointer text-xs py-1 px-3 transition-all font-semibold"
                onClick={() => handleToggleFilter("All")}
              >
                All
              </Badge>
              {SIGNAL_FILTERS.filter(f => f.label !== "All").map(f => {
                const isSelected = activeFilters.includes(f.label);
                return (
                  <Badge
                    key={f.label}
                    variant={isSelected ? f.variant as any : "outline"}
                    className={`cursor-pointer text-xs py-1 px-3 transition-all font-semibold ${
                      isSelected ? "shadow-sm border-transparent" : "border-border hover:border-text-muted"
                    }`}
                    onClick={() => handleToggleFilter(f.label)}
                  >
                    {f.label}
                    {isSelected && <X className="w-3 h-3 ml-1.5 inline-block text-current" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Sector Filters */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Sector</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeSectors.length === 0 ? "default" : "outline"}
                className="cursor-pointer text-xs py-1 px-3 transition-all font-semibold"
                onClick={() => handleToggleSector("All")}
              >
                All
              </Badge>
              {sectors.filter(s => s !== "All").map(s => {
                const isSelected = activeSectors.includes(s);
                return (
                  <Badge
                    key={s}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer text-xs py-1 px-3 transition-all font-semibold ${
                      isSelected ? "shadow-sm border-transparent" : "border-border hover:border-text-muted"
                    }`}
                    onClick={() => handleToggleSector(s)}
                  >
                    {s}
                    {isSelected && <X className="w-3 h-3 ml-1.5 inline-block text-current" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Card className="border border-border bg-surface hover:shadow-md transition-all duration-200 min-h-[300px]">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-text-muted">Scanning 500+ stocks…</span>
            </div>
          ) : paginated.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <GridView paginated={paginated} />
              ) : (
                <TableView paginated={paginated} />
              )}

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-border/30 mt-4">
                <span className="text-[10px] text-text-muted font-bold">
                  Showing {paginated.length} of {sortedStocks.length}
                </span>
                <div className="flex items-center gap-2">
                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCount(c => c + 12)}
                      className="text-xs font-bold border-primary/20 hover:border-primary hover:bg-primary/5 transition-all h-8"
                    >
                      Show More (+12)
                    </Button>
                  )}
                  {visibleCount > 12 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCount(12)}
                      className="text-xs font-bold border-border hover:bg-white/5 transition-all text-text-muted hover:text-text-primary h-8"
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in space-y-3">
              <SlidersHorizontal className="w-10 h-10 mx-auto text-text-muted/40" />
              <p className="text-sm text-text-muted font-medium">
                No stocks match your filters.
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> Reset all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function sortValue(s: any, key: SortKey): number | string {
  switch (key) {
    case "score": return s.buyScore ?? 0;
    case "change": return s.regularMarketChangePercent ?? 0;
    case "price": return s.regularMarketPrice ?? 0;
    case "symbol": return String(s.symbol ?? "");
  }
}

/* ─────────────── Sub-views ─────────────── */

function GridView({ paginated }: { paginated: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {paginated.map((stock) => {
        const { logo, bg, color } = getLogoInfo(stock.symbol, stock.sector || "");
        const isPositive = stock.regularMarketChangePercent > 0;

        return (
          <Link
            href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}
            key={stock.symbol}
            className="block animate-fade-in"
          >
            <div className="rounded-xl border border-border bg-card p-4 hover:scale-[1.01] hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${bg} ${color}`}>
                      {logo}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary text-sm uppercase leading-none">
                        {stock.symbol.split(":")[0]}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 truncate max-w-[100px]">
                        {stock.shortName}
                      </div>
                    </div>
                  </div>

                  <Badge variant={stock.badgeVariant as any} className="text-[9px] px-1.5 py-0.5 whitespace-nowrap">
                    {stock.metricBadge}
                  </Badge>
                </div>

                {stock.sector && (
                  <div className="mb-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted/70 uppercase tracking-wide font-bold">
                      {stock.sector}
                    </span>
                  </div>
                )}

                <div className="my-3">
                  <div className="text-lg font-extrabold text-text-primary">
                    {formatCurrency(stock.regularMarketPrice, stock.currency)}
                  </div>
                  <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {isPositive ? "▲" : "▼"} {formatPercent(stock.regularMarketChangePercent)}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between items-center text-[9px] font-bold text-text-muted">
                    <span>BUY SCORE</span>
                    <span className={stock.buyScore >= 70 ? "text-green-400" : stock.buyScore >= 55 ? "text-primary" : "text-yellow-400"}>
                      {stock.buyScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border/20">
                    <div
                      className={`h-full rounded-full transition-all ${stock.buyScore >= 70 ? "bg-green-400" : stock.buyScore >= 55 ? "bg-primary" : "bg-yellow-400"}`}
                      style={{ width: `${stock.buyScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] font-bold text-primary group-hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-1 mt-auto"
              >
                Analyse <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TableView({ paginated }: { paginated: any[] }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-wider text-text-muted border-b border-border/40">
            <th className="text-left py-2 px-2">Symbol</th>
            <th className="text-left py-2 px-2 hidden md:table-cell">Sector</th>
            <th className="text-right py-2 px-2">Price</th>
            <th className="text-right py-2 px-2">Change</th>
            <th className="text-left py-2 px-2 w-[28%]">Buy Score</th>
            <th className="text-right py-2 px-2 hidden lg:table-cell">Signal</th>
            <th className="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((stock) => {
            const { logo, bg, color } = getLogoInfo(stock.symbol, stock.sector || "");
            const isPositive = stock.regularMarketChangePercent > 0;
            return (
              <tr
                key={stock.symbol}
                className="border-b border-border/20 hover:bg-primary/5 transition-colors group"
              >
                <td className="py-2.5 px-2">
                  <Link
                    href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${bg} ${color}`}>
                      {logo}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary text-xs uppercase leading-none">
                        {stock.symbol.split(":")[0]}
                      </div>
                      <div className="text-[9px] text-text-muted mt-0.5 truncate max-w-[140px]">
                        {stock.shortName}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-2.5 px-2 hidden md:table-cell">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted/80 uppercase tracking-wide font-bold">
                    {stock.sector || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right font-bold text-text-primary">
                  {formatCurrency(stock.regularMarketPrice, stock.currency)}
                </td>
                <td className={`py-2.5 px-2 text-right font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "▲" : "▼"} {formatPercent(stock.regularMarketChangePercent)}
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border/20">
                      <div
                        className={`h-full rounded-full ${stock.buyScore >= 70 ? "bg-green-400" : stock.buyScore >= 55 ? "bg-primary" : "bg-yellow-400"}`}
                        style={{ width: `${stock.buyScore}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-black w-8 text-right ${stock.buyScore >= 70 ? "text-green-400" : stock.buyScore >= 55 ? "text-primary" : "text-yellow-400"}`}>
                      {stock.buyScore}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right hidden lg:table-cell">
                  <Badge variant={stock.badgeVariant as any} className="text-[9px] px-1.5 py-0.5">
                    {stock.metricBadge}
                  </Badge>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <Link
                    href={`/dashboard/analysis?symbol=${encodeURIComponent(stock.symbol)}`}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:underline"
                  >
                    Analyse <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MiniStat({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "emerald" | "green" | "red";
}) {
  const toneMap = {
    primary: "border-primary/20 bg-primary/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    green: "border-green-500/20 bg-green-500/5",
    red: "border-red-500/20 bg-red-500/5",
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${toneMap[tone]}`}>
      {icon}
      <div className="min-w-0">
        <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-sm font-black text-text-primary leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary">
      {children}
      <button onClick={onRemove} className="hover:text-red-400">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
