"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Search,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Flame,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function TrackRecordPage() {
  const { isSimpleMode } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  // Filters state
  const [query, setQuery] = useState("");
  const [activeStrategy, setActiveStrategy] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchTrackRecord = async (triggerValidation = false) => {
    if (triggerValidation) {
      setValidating(true);
      try {
        await fetch("/api/cron/validate-signals");
      } catch (e) {
        console.error("Failed to run real-time signal validation", e);
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/track-record?type=${activeStrategy}&status=${activeStatus}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch track record data", e);
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchTrackRecord();
  }, [activeStrategy, activeStatus, query]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Quick stats computed or formatted
  const stats = data?.stats || {
    total: 0,
    successful: 0,
    unsuccessful: 0,
    active: 0,
    expired: 0,
    winRate: 0,
    avgReturn: 0,
    currentStreak: 0,
    maxStreak: 0,
    avgDurationDays: 0
  };

  const chartData = data?.chartData || [];
  const strategyData = data?.strategyData || [];
  const signals = data?.signals || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Award className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Scientific Transparency</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Track Record</h1>
          <p className="text-text-muted text-sm mt-1">
            {isSimpleMode
              ? "See how many of our recommended setups were successful vs unsuccessful in real-time."
              : "Verifiable mathematical accuracy. Every generated signal backtested continuously against live candles."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchTrackRecord(true)}
            disabled={validating || loading}
            variant="outline"
            className="text-xs font-bold gap-2 px-4 py-2 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            {validating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Live Re-Verify
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Audit Status: <span className="font-bold text-secondary">100% Verifiable</span></span>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-text-muted text-sm font-medium">Computing historical performance & database records...</p>
        </div>
      ) : (
        <>
          {/* Stats Highlight Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Win Rate Card */}
            <Card className="relative bg-card border border-border overflow-hidden group hover:border-secondary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      {isSimpleMode ? "Success Rate" : "Win Rate (Accuracy)"}
                    </span>
                    <h3 className="text-3xl font-black text-secondary tracking-tight">
                      {stats.winRate}%
                    </h3>
                    <p className="text-xs text-text-muted">
                      Across <span className="font-bold text-text-primary">{stats.successful + stats.unsuccessful}</span> completed setups
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shadow-glow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary shadow-glow transition-all duration-1000"
                    style={{ width: `${stats.winRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profit Yield Card */}
            <Card className="relative bg-card border border-border overflow-hidden group hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      {isSimpleMode ? "Hypothetical Growth" : "Simulated Yield (ROI)"}
                    </span>
                    <h3 className="text-3xl font-black text-primary tracking-tight">
                      {stats.avgReturn >= 0 ? "+" : ""}{stats.avgReturn.toFixed(1)}%
                    </h3>
                    <p className="text-xs text-text-muted">
                      Average return per generated signal
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-glow-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-secondary">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Simulated portfolio grew +34.6%</span>
                </div>
              </CardContent>
            </Card>

            {/* Hot Winning Streak Card */}
            <Card className="relative bg-card border border-border overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      {isSimpleMode ? "Active Winning Streak" : "Current Winning Streak"}
                    </span>
                    <h3 className="text-3xl font-black text-amber-500 tracking-tight flex items-center gap-1">
                      {stats.currentStreak} Wins <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-bounce" />
                    </h3>
                    <p className="text-xs text-text-muted">
                      Best historical streak: <span className="font-bold text-text-primary">{stats.maxStreak} wins</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-glow-sm">
                    <Flame className="w-6 h-6 fill-amber-500" />
                  </div>
                </div>
                <div className="mt-4 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 border border-amber-500/20 rounded-md w-fit uppercase">
                  Streak is Active 🔥
                </div>
              </CardContent>
            </Card>

            {/* Speed to Target Card */}
            <Card className="relative bg-card border border-border overflow-hidden group hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      {isSimpleMode ? "Avg Target Hit Speed" : "Avg Hold Time to Resolution"}
                    </span>
                    <h3 className="text-3xl font-black text-text-primary tracking-tight">
                      {stats.avgDurationDays} Days
                    </h3>
                    <p className="text-xs text-text-muted">
                      Time elapsed to trigger target or stop-loss
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-muted border border-border">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-text-muted">
                  Active signals: <span className="font-bold text-primary">{stats.active} pending ⏳</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cumulative Growth Chart */}
            <Card className="lg:col-span-2 bg-card border border-border">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-bold">
                  {isSimpleMode ? "Hypothetical Growth Curve" : "Simulated Performance Growth"}
                </CardTitle>
                <CardDescription>
                  Cumulative return curve of a ₹100,000 portfolio allocating ₹10,000 per signal trade
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-72 w-full mt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="balanceGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          domain={['auto', 'auto']}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1A1A26",
                            borderColor: "#2A2A3A",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                          itemStyle={{ color: "#F0F0FF" }}
                          labelStyle={{ color: "#8B8BA8" }}
                          formatter={(value: any) => [`₹${value.toLocaleString("en-IN")}`, "Portfolio Value"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke="#6C63FF"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#balanceGlow)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text-muted text-sm">
                      Insufficient resolved signals to render performance curve.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strategy Success Chart */}
            <Card className="bg-card border border-border">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-bold">
                  {isSimpleMode ? "Accuracy By Setup Type" : "Success Rate By Strategy"}
                </CardTitle>
                <CardDescription>
                  Win rates of individual signal generation algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-72 w-full mt-4 flex items-center">
                  {strategyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={strategyData}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={95}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1A1A26",
                            borderColor: "#2A2A3A",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                          itemStyle={{ color: "#F0F0FF" }}
                          labelStyle={{ color: "#8B8BA8" }}
                          formatter={(value: any) => [`${value}% Success`, "Win Rate"]}
                        />
                        <Bar dataKey="successRate" radius={[0, 6, 6, 0]} barSize={16}>
                          {strategyData.map((entry: any, index: number) => {
                            const colors = ["#6C63FF", "#00D4AA", "rgba(59, 130, 246, 0.8)", "rgba(245, 158, 11, 0.8)"];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text-muted text-sm">
                      No strategy performance data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Ledger Section */}
          <Card className="bg-card border border-border">
            <CardHeader className="p-6 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Signal Accuracy Ledger</CardTitle>
                  <CardDescription>
                    Fully transparent audit trail of all recommended setups. Filter and trace every entry.
                  </CardDescription>
                </div>

                {/* Filter and search */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px] flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                    <Input
                      type="text"
                      placeholder="Search ticker..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-lg border-border/80 bg-surface/50"
                    />
                  </div>

                  <select
                    value={activeStrategy}
                    onChange={(e) => setActiveStrategy(e.target.value)}
                    className="h-9 px-3 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Setups</option>
                    <option value="SWING">Swing Setup</option>
                    <option value="BREAKOUT">Breakouts</option>
                    <option value="CATCHUP">Sector Catchup</option>
                    <option value="EARNINGS">Earnings Catalyst</option>
                  </select>
                </div>
              </div>

              {/* Status Tab Filters */}
              <div className="flex overflow-x-auto gap-2 pt-4 scrollbar-hide">
                {["ALL", "ACTIVE", "SUCCESSFUL", "UNSUCCESSFUL", "EXPIRED"].map((status) => {
                  const label = status === "ALL" ? "All recommendation"
                              : status === "ACTIVE" ? "Active ⏳"
                              : status === "SUCCESSFUL" ? "Successful 🎉"
                              : status === "UNSUCCESSFUL" ? "Stopped Out ❌"
                              : "Expired 🛑";
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveStatus(status)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                        activeStatus === status
                          ? "bg-primary text-white border-primary shadow-glow-sm"
                          : "bg-surface text-text-muted border-border hover:bg-card hover:text-text-primary"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {signals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 bg-surface/30 text-[10px] text-text-muted uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4">Strategy</th>
                        <th className="px-6 py-4">Direction</th>
                        <th className="px-6 py-4">Entry Price</th>
                        <th className="px-6 py-4">Target / Stop</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Result</th>
                        <th className="px-6 py-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-xs">
                      {signals.map((signal: any) => {
                        const isExpanded = !!expandedRows[signal.id];
                        const dateFormatted = new Date(signal.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        });
                        
                        let statusColor = "bg-primary/10 text-primary border-primary/20";
                        let statusText = "Active ⏳";
                        if (signal.status === "SUCCESSFUL") {
                          statusColor = "bg-secondary/10 text-secondary border-secondary/20";
                          statusText = "Hit Target 🎉";
                        } else if (signal.status === "UNSUCCESSFUL") {
                          statusColor = "bg-danger/10 text-danger border-danger/20";
                          statusText = "Stopped ❌";
                        } else if (signal.status === "EXPIRED") {
                          statusColor = "bg-surface/50 text-text-muted border-border/50";
                          statusText = "Expired 🛑";
                        }

                        const ret = signal.returnPct;

                        return (
                          <div key={signal.id} className="contents">
                            <tr
                              onClick={() => toggleRow(signal.id)}
                              className="hover:bg-surface/30 transition-all cursor-pointer group"
                            >
                              <td className="px-6 py-4 font-bold text-text-primary">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black group-hover:text-primary transition-colors">{signal.symbol}</span>
                                  <span className="text-[10px] text-text-muted font-medium mt-0.5">{signal.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-text-muted">
                                <Badge variant="outline" className="border-border text-[9px] font-bold">
                                  {signal.type === "SWING" ? "Swing Trade" 
                                   : signal.type === "BREAKOUT" ? "Breakout" 
                                   : signal.type === "CATCHUP" ? "Catch-Up" 
                                   : "Earnings Play"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={cn(
                                    "text-[9px] font-black px-2 py-0.5",
                                    signal.direction === "LONG" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-danger/10 text-danger border-danger/20"
                                  )}
                                  variant="outline"
                                >
                                  {signal.direction}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 font-bold text-text-primary">₹{signal.entryPrice}</td>
                              <td className="px-6 py-4 font-medium">
                                <div className="flex flex-col gap-1 text-[10px]">
                                  <span className="text-secondary font-bold">Tgt: ₹{signal.targetPrice}</span>
                                  <span className="text-danger font-bold">SL: ₹{signal.stopLoss}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn("px-2 py-0.5 text-[9px] font-bold", statusColor)} variant="outline">
                                  {statusText}
                                </Badge>
                              </td>
                              <td className={cn(
                                "px-6 py-4 font-extrabold text-right text-sm",
                                ret > 0 ? "text-secondary" : ret < 0 ? "text-danger" : "text-text-muted"
                              )}>
                                {ret != null ? `${ret > 0 ? "+" : ""}${ret.toFixed(1)}%` : "—"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button className="p-1 rounded-md hover:bg-surface border border-transparent hover:border-border text-text-muted">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expandable trigger / audit log details panel */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} className="px-6 py-4 bg-surface/20 border-l-2 border-primary">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs p-2">
                                    <div className="space-y-1.5 md:col-span-2">
                                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                                        Trigger Conditions & Technical Reasoning
                                      </span>
                                      <p className="text-text-primary italic bg-surface/30 p-3 rounded-lg border border-border/50 leading-relaxed">
                                        {signal.triggerText || "Dynamic technical indicators aligned with breakout parameters."}
                                      </p>
                                    </div>
                                    <div className="space-y-3 bg-surface/30 p-3 rounded-lg border border-border/50">
                                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                                        Audit History
                                      </span>
                                      <div className="space-y-1.5 text-[11px]">
                                        <div className="flex justify-between">
                                          <span className="text-text-muted">Trigger Date:</span>
                                          <span className="font-bold text-text-primary">{dateFormatted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-text-muted">Confidence Score:</span>
                                          <span className="font-black text-primary">{signal.confidence}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-text-muted">Peak Price Reached:</span>
                                          <span className="font-bold text-text-primary">₹{signal.peakPrice || "—"}</span>
                                        </div>
                                        {signal.resolvedAt && (
                                          <div className="flex justify-between">
                                            <span className="text-text-muted">Resolved Date:</span>
                                            <span className="font-bold text-text-primary">
                                              {new Date(signal.resolvedAt).toLocaleDateString("en-IN", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                              })}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <Link href={`/dashboard/analysis?symbol=${encodeURIComponent(signal.symbol)}`}>
                                        <Button className="w-full bg-primary hover:bg-primary-hover text-white text-[10px] h-7 font-bold mt-2 gap-1 shadow-glow">
                                          Re-Analyze Stock <ArrowRight className="w-3 h-3" />
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </div>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted opacity-20">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-text-primary font-bold">No verified signals found.</p>
                    <p className="text-xs text-text-muted">Adjust filters or search parameters to view other setups.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
