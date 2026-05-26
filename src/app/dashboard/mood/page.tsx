import { Suspense } from "react";
import { auth } from "@/lib/auth";
import MarketMoodDashboard from "@/components/MarketMoodDashboard";
import { Activity, Info } from "lucide-react";


export default async function MarketMoodPage() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Macro View</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Market Mood</h1>
          <p className="text-text-muted text-sm mt-1">
            Understand the broader market sentiment and breadth at a glance.
          </p>
        </div>
      </div>



      <Suspense fallback={<MarketMoodSkeleton />}>
        <MarketMoodDashboard userId={userId} />
      </Suspense>
    </div>
  );
}

function MarketMoodSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Gauge Skeleton */}
      <div className="h-64 bg-surface rounded-xl border border-border" />
      {/* Breadth Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl border border-border" />
        ))}
      </div>
      {/* Grid for Sector Pulse and Signals */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-80 bg-surface rounded-xl border border-border" />
        <div className="h-80 bg-surface rounded-xl border border-border" />
      </div>
    </div>
  );
}
