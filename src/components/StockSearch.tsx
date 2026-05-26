// filepath: src/components/StockSearch.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  type: string;
}

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  disabled?: boolean;
}

export default function StockSearch({ onSelect, disabled }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.slice(0, 8)); // Limit to 8 results
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    // For Twelve Data, international symbols should be formatted as SYMBOL:EXCHANGE
    const fullSymbol = item.country !== "United States" && item.exchange 
      ? `${item.symbol}:${item.exchange}` 
      : item.symbol;
      
    onSelect(fullSymbol);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          type="text"
          placeholder="Search name or symbol (e.g. Reliance, TCS, HDFC)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-9 pr-10 h-11"
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[320px] overflow-y-auto">
            {results.map((item) => (
              <button
                key={`${item.symbol}-${item.exchange}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0 group"
              >
                <div className="flex flex-col items-start gap-0.5 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary group-hover:text-primary transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted uppercase">
                      {item.exchange}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted truncate w-full">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[10px] text-text-muted font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
                    {item.country}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-6 text-center shadow-xl z-[60]">
          <p className="text-sm text-text-muted">No stocks found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
