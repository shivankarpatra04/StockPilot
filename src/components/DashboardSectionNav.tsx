// filepath: src/components/DashboardSectionNav.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Sparkles,
  Activity,
  Map,
  Lightbulb,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "best-trade", label: "Best Trade", short: "Best", Icon: Award, color: "text-primary" },
  { id: "briefing", label: "Briefing", short: "Brief", Icon: Sparkles, color: "text-violet-400" },
  { id: "sentiment", label: "Sentiment", short: "Mood", Icon: Activity, color: "text-emerald-400" },
  { id: "sectors", label: "Sectors", short: "Sectors", Icon: Map, color: "text-sky-400" },
  { id: "opportunities", label: "Opportunities", short: "Opps", Icon: Lightbulb, color: "text-amber-400" },
  { id: "watchlist", label: "Watchlist", short: "Watch", Icon: Star, color: "text-yellow-400" },
  { id: "screener", label: "Screener", short: "Screen", Icon: SlidersHorizontal, color: "text-pink-400" },
] as const;

export default function DashboardSectionNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const onIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
    };
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(onIntersect, {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 backdrop-blur-md bg-background/70 border-b border-border/40">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          const Icon = s.Icon;
          return (
            <button
              key={s.id}
              onClick={() => handleJump(s.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-200",
                isActive
                  ? `bg-card border border-border ${s.color} shadow-sm`
                  : "text-text-muted border border-transparent hover:text-text-primary hover:bg-card/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
