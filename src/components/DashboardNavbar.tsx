// filepath: src/components/DashboardNavbar.tsx
"use client";

import { useAppStore } from "@/store/useAppStore";
import { Menu, User, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import GlobalAnalysisSelector from "./GlobalAnalysisSelector";

export default function DashboardNavbar() {
  const { toggleSidebar, sidebarOpen } = useAppStore();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 md:px-6 border-b border-border bg-background/80 backdrop-blur-md gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 -ml-1 text-text-muted hover:text-text-primary transition-colors md:hidden"
          )}
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded bg-gradient-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
        </Link>
        
        {/* Desktop Title or Page Context could go here */}
        <div className="hidden md:block">
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Market Analysis</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center min-w-0 px-1 md:px-4">
        <GlobalAnalysisSelector />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {session?.user && (
          <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full bg-card border border-border shadow-sm">
            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="hidden sm:inline text-[11px] text-text-primary font-bold truncate max-w-[80px]">
              {session.user.name ?? session.user.email?.split('@')[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
