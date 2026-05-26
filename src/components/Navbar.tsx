// filepath: src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BarChart2, LogOut, User, Zap } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StockPilot
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
            >
              Pricing
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
            ) : null}
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-button bg-card border border-border">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm text-text-primary font-medium">
                    {session.user?.name ?? session.user?.email ?? "User"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
