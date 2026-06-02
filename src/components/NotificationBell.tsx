"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  TARGET: "Target",
  STOP_LOSS: "Stop Loss",
  BUY_ZONE: "Buy Zone",
  SELL_ZONE: "Sell Zone",
  CUSTOM: "Alert",
};

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const triggered = alerts.filter(a => a.triggered);
  const unseenCount = triggered.filter(a => !a.seen).length;

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch {
      // network hiccup — keep last known state
    }
  }, []);

  // Initial load + poll every 60s so the badge stays fresh while the app is open.
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close the panel when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    // Mark everything as seen when the user opens the panel.
    if (next && unseenCount > 0) {
      setAlerts(prev => prev.map(a => (a.triggered ? { ...a, seen: true } : a)));
      try {
        await fetch("/api/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAllSeen: true }),
        });
      } catch {
        // best-effort
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary">Triggered alerts</h4>
            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {triggered.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">
                No alerts have been hit yet.
              </div>
            ) : (
              triggered
                .slice()
                .sort((a, b) => new Date(b.triggeredAt || 0).getTime() - new Date(a.triggeredAt || 0).getTime())
                .map(alert => {
                  const symbolStr = alert.symbol.split(":")[0];
                  const arrow = alert.condition === "above" ? "≥" : "≤";
                  return (
                    <Link
                      key={alert.id}
                      href={`/dashboard/analysis?symbol=${encodeURIComponent(alert.symbol)}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-surface/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary">
                          <span className="text-primary mr-1.5">{symbolStr}</span>
                          {TYPE_LABEL[alert.alertType] || "Alert"} hit
                        </p>
                        <p className="text-xs text-text-muted">
                          {alert.note ? alert.note : `Price ${arrow} ₹${alert.targetPrice}`}
                        </p>
                        {alert.triggeredAt && (
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })
            )}
          </div>

          <Link
            href="/dashboard/alerts"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-xs font-bold text-primary border-t border-border hover:bg-surface/50 transition-colors"
          >
            View all alerts
          </Link>
        </div>
      )}
    </div>
  );
}
