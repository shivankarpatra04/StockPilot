import { Suspense } from "react";
import { auth } from "@/lib/auth";
import AlertsDashboard from "@/components/AlertsDashboard";
import { Bell } from "lucide-react";


export default async function AlertsPage() {
  const session = await auth();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Bell className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Alerts Center</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Price Alerts</h1>
          <p className="text-text-muted text-sm mt-1">
            Set and forget. Track distance-to-target and automatically catch setups.
          </p>
        </div>
      </div>



      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsDashboard userId={session?.user?.id} />
      </Suspense>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Strip Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl border border-border" />
        ))}
      </div>
      {/* Grid for content */}
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 h-96 bg-surface rounded-xl border border-border" />
        <div className="md:col-span-8 h-96 bg-surface rounded-xl border border-border" />
      </div>
    </div>
  );
}
