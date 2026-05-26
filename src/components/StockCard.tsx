// filepath: src/components/StockCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import AIScoreBadge from "@/components/AIScoreBadge";
import { formatCurrency, formatPercent, getChangeColor, formatVolume } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockQuote, AIScore } from "@/types";

interface StockCardProps {
  quote: StockQuote;
  aiScore?: AIScore;
  compact?: boolean;
  className?: string;
}

export default function StockCard({
  quote,
  aiScore,
  compact = false,
  className,
}: StockCardProps) {
  const changePercent = quote.regularMarketChangePercent;
  const changeColor = getChangeColor(changePercent);

  const TrendIcon =
    changePercent > 0 ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;

  return (
    <Card
      className={`hover:border-primary/30 hover:shadow-glow transition-all duration-200 ${className ?? ""}`}
    >
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary text-sm uppercase tracking-wide">
                {quote.symbol}
              </span>
              {aiScore && (
                <AIScoreBadge
                  score={aiScore.score}
                  label={aiScore.label}
                  size="sm"
                  showLabel={false}
                />
              )}
            </div>
            <p className="text-xs text-text-muted truncate mt-0.5">
              {quote.shortName}
            </p>
          </div>
          <div className="text-right ml-3 flex-shrink-0">
            <p className="font-bold text-text-primary text-base">
              {formatCurrency(quote.regularMarketPrice, quote.currency)}
            </p>
            <div className={`flex items-center gap-1 justify-end text-xs font-medium ${changeColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{formatPercent(changePercent)}</span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-text-muted">Volume</p>
              <p className="text-sm font-medium text-text-primary">
                {formatVolume(quote.regularMarketVolume)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">P/E Ratio</p>
              <p className="text-sm font-medium text-text-primary">
                {quote.trailingPE ? quote.trailingPE.toFixed(1) : "N/A"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
