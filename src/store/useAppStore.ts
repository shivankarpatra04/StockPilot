// filepath: src/store/useAppStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StockQuote, WatchlistItem } from "@/types";

interface AppState {
  // Watchlist
  watchlistSymbols: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setWatchlistSymbols: (symbols: string[]) => void;

  // Comparison
  comparisonSymbols: string[];
  addComparisonSymbol: (symbol: string) => void;
  removeComparisonSymbol: (symbol: string) => void;
  clearComparisonSymbols: () => void;
  setComparisonSymbols: (symbols: string[]) => void;

  // Cached quotes
  cachedQuotes: Record<string, StockQuote>;
  setCachedQuote: (symbol: string, quote: StockQuote) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Global Settings
  analysisDays: number;
  setAnalysisDays: (days: number) => void;
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (simple: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Watchlist
      watchlistSymbols: [],
      addToWatchlist: (symbol: string) => {
        const upper = symbol.toUpperCase();
        if (!get().watchlistSymbols.includes(upper)) {
          set((state) => ({
            watchlistSymbols: [...state.watchlistSymbols, upper],
          }));
        }
      },
      removeFromWatchlist: (symbol: string) => {
        const upper = symbol.toUpperCase();
        set((state) => ({
          watchlistSymbols: state.watchlistSymbols.filter((s) => s !== upper),
        }));
      },
      setWatchlistSymbols: (symbols: string[]) => {
        set({ watchlistSymbols: symbols.map((s) => s.toUpperCase()) });
      },

      // Comparison
      comparisonSymbols: [],
      addComparisonSymbol: (symbol: string) => {
        const upper = symbol.toUpperCase();
        const current = get().comparisonSymbols;
        if (current.length < 3 && !current.includes(upper)) {
          set((state) => ({
            comparisonSymbols: [...state.comparisonSymbols, upper],
          }));
        }
      },
      removeComparisonSymbol: (symbol: string) => {
        const upper = symbol.toUpperCase();
        set((state) => ({
          comparisonSymbols: state.comparisonSymbols.filter((s) => s !== upper),
        }));
      },
      clearComparisonSymbols: () => set({ comparisonSymbols: [] }),
      setComparisonSymbols: (symbols: string[]) => {
        set({ comparisonSymbols: symbols.slice(0, 3).map((s) => s.toUpperCase()) });
      },

      // Cached quotes
      cachedQuotes: {},
      setCachedQuote: (symbol: string, quote: StockQuote) => {
        set((state) => ({
          cachedQuotes: { ...state.cachedQuotes, [symbol.toUpperCase()]: quote },
        }));
      },

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      // Global Settings
      analysisDays: 30,
      setAnalysisDays: (days: number) => set({ analysisDays: days }),
      isSimpleMode: false,
      toggleSimpleMode: () => set((state) => ({ isSimpleMode: !state.isSimpleMode })),
      setSimpleMode: (simple: boolean) => set({ isSimpleMode: simple }),
    }),
    {
      name: "stockpilot-app-store",
      partialize: (state) => ({
        watchlistSymbols: state.watchlistSymbols,
        comparisonSymbols: state.comparisonSymbols,
        sidebarOpen: state.sidebarOpen,
        analysisDays: state.analysisDays,
        isSimpleMode: state.isSimpleMode,
      }),
    }
  )
);
