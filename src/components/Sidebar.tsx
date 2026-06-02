// filepath: src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitCompare,
  Star,
  Lightbulb,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  X,
  LogOut,
  Award,
} from "lucide-react";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Lightbulb },
  { href: "/dashboard/track-record", label: "Track Record", icon: Award },
  { href: "/dashboard/mood", label: "Market Mood", icon: Activity },
  { href: "/dashboard/analysis", label: "Analysis", icon: Target },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-surface border-r border-border transition-all duration-300 ease-in-out md:relative overflow-hidden",
          sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-border transition-all duration-300",
            sidebarOpen ? "px-4 gap-3" : "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex-shrink-0 flex items-center justify-center shadow-glow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          
          <span
            className={cn(
              "text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate transition-all duration-300",
              sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"
            )}
          >
            StockPilot
          </span>

          {/* Close button for mobile */}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto md:hidden p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-button py-2.5 text-sm font-medium transition-all duration-200 group",
                      sidebarOpen ? "px-3 gap-3" : "px-0 justify-center",
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-text-muted hover:bg-card hover:text-text-primary border border-transparent"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-text-muted group-hover:text-text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "truncate transition-all duration-300",
                        sidebarOpen ? "opacity-100 w-auto ml-0" : "opacity-0 w-0 overflow-hidden"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-2">
          {sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center px-3 py-2.5 rounded-button text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-200 gap-3"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Log Out</span>
            </button>
          )}

          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center h-9 rounded-button border border-border text-text-muted hover:text-text-primary hover:bg-card transition-all duration-200"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}


