// filepath: src/app/dashboard/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import ClaudeBriefingCard from "@/components/ClaudeBriefingCard";
import DashboardData from "@/components/DashboardData";
import WatchlistSnapshot from "@/components/WatchlistSnapshot";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import AIStockScreener from "@/components/AIStockScreener";
import BestTradeFinder from "@/components/BestTradeFinder";
import SectorHeatmap from "@/components/SectorHeatmap";
import HiddenOpportunities from "@/components/HiddenOpportunities";
import DashboardSectionHeader from "@/components/DashboardSectionHeader";
import DashboardQuickStats from "@/components/DashboardQuickStats";
import DashboardSectionNav from "@/components/DashboardSectionNav";
import { Sparkles, Activity, Award, Star, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Premium Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "Investor"} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1 font-medium">
            Your 500-stock powered real-time market intelligence dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 border border-border rounded-xl w-max self-start sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-[10px] text-text-primary font-bold uppercase tracking-wider">500+ Assets Scanned</span>
        </div>
      </div>

      {/* ── Quick Stats Strip (instant orientation) ── */}
      <DashboardQuickStats />

      {/* ── Sticky Section Jump Nav ── */}
      <DashboardSectionNav />

      {/* #01 Best Trade Recommendation — moved up: this is what users come for */}
      <section id="best-trade" className="space-y-4 scroll-mt-24">
        <DashboardSectionHeader
          number="01"
          title="Best Trade Recommendation"
          subtitle="Peak-signal algorithmic mathematical pick detected across Nifty 500."
          icon={<Award className="w-5 h-5 text-primary" />}
        />
        <BestTradeFinder />
      </section>

      {/* #02 Daily Market Briefing */}
      <section id="briefing" className="space-y-4 scroll-mt-24">
        <DashboardSectionHeader
          number="02"
          title="Daily Market Briefing"
          subtitle="Deterministic overview and focus checklist generated from scanned metrics."
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <ClaudeBriefingCard />
      </section>

      {/* #03 Market Sentiment & Status */}
      <section id="sentiment" className="space-y-4 scroll-mt-24">
        <DashboardSectionHeader
          number="03"
          title="Market Sentiment & Status"
          subtitle="Overall market advance-decline dynamics, sentiment metrics, and active movers."
          icon={<Activity className="w-5 h-5 text-primary" />}
        />
        <DashboardData />
      </section>

      {/* #04 Sector Performance & Heatmap */}
      <section id="sectors" className="scroll-mt-24">
        <SectorHeatmap />
      </section>

      {/* #05 Hidden Opportunities */}
      <section id="opportunities" className="scroll-mt-24">
        <HiddenOpportunities />
      </section>

      {/* #06 Watchlist Snapshot */}
      <section id="watchlist" className="space-y-4 scroll-mt-24">
        <DashboardSectionHeader
          number="06"
          title="Watchlist Snapshot"
          subtitle="Real-time pricing and algorithmic score evaluations for your active watchlist."
          icon={<Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />}
          action={
            <Link
              href="/dashboard/watchlist"
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group/link"
            >
              Manage Watchlist
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          }
        />
        <Suspense fallback={<WatchlistSkeleton />}>
          <WatchlistSnapshot />
        </Suspense>
      </section>

      {/* #07 Stock Screener */}
      <section id="screener" className="scroll-mt-24">
        <AIStockScreener />
      </section>
    </div>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 h-36 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface/50 border border-border" />
                <div className="space-y-1">
                  <div className="h-3 w-12 bg-surface/50 rounded" />
                  <div className="h-2 w-16 bg-surface/50 rounded" />
                </div>
              </div>
              <div className="w-6 h-6 rounded bg-surface/50" />
            </div>
            <div className="space-y-1 my-3">
              <div className="h-4 w-20 bg-surface/50 rounded" />
              <div className="h-2.5 w-10 bg-surface/50 rounded" />
            </div>
            <div className="h-7 w-full bg-surface/50 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
