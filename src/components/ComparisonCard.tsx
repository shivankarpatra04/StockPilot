// filepath: src/components/ComparisonCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIScoreRing } from "@/components/AIScoreBadge";
import {
  formatCurrency,
  formatPercent,
  formatLargeNumber,
  formatVolume,
  getChangeColor,
  getCurrencySymbol,
} from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockQuote, AIScore } from "@/types";

interface ComparisonCardProps {
  quote: StockQuote;
  aiScore: AIScore;
}

const labelVariant: Record<
  AIScore["label"],
  "default" | "secondary" | "warning" | "destructive"
> = {
  "Strong Buy": "secondary",
  Bullish: "default",
  Neutral: "warning",
  Caution: "destructive",
};

export default function ComparisonCard({ quote, aiScore }: ComparisonCardProps) {
  const changePercent = quote.regularMarketChangePercent;
  const changeColor = getChangeColor(changePercent);
  const TrendIcon =
    changePercent > 0 ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;

  return (
    <Card className="hover:border-primary/40 hover:shadow-glow transition-all duration-300 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{quote.shortName}</CardTitle>
            <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">
              {quote.symbol}
            </p>
          </div>
          <AIScoreRing score={aiScore.score} size={72} />
        </div>
        <Badge
          variant={labelVariant[aiScore.label]}
          className="w-fit mt-1"
        >
          {aiScore.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price + Change */}
        <div className="flex items-center justify-between p-3 rounded-button bg-surface border border-border">
          <div>
            <p className="text-xs text-text-muted">Current Price</p>
            <p className="text-xl font-bold text-text-primary">
              {formatCurrency(quote.regularMarketPrice, quote.currency)}
            </p>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${changeColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{formatPercent(changePercent)}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <MetricRow label="P/E Ratio" value={quote.trailingPE ? quote.trailingPE.toFixed(1) : "N/A"} />
          <MetricRow label="Market Cap" value={formatLargeNumber(quote.marketCap, getCurrencySymbol(quote.currency))} />
          <MetricRow
            label="52W High"
            value={formatCurrency(quote.fiftyTwoWeekHigh, quote.currency)}
          />
          <MetricRow
            label="52W Low"
            value={formatCurrency(quote.fiftyTwoWeekLow, quote.currency)}
          />
          <MetricRow label="Volume" value={formatVolume(quote.regularMarketVolume)} />
          <MetricRow
            label="Rev Growth"
            value={
              quote.revenueGrowth !== null
                ? formatPercent(quote.revenueGrowth * 100)
                : "N/A"
            }
          />
        </div>

        {/* Score Breakdown */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-muted mb-2 font-medium">Score Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {aiScore.breakdown.dayChangeLarge && (
              <ScorePill label="Strong Momentum" />
            )}
            {!aiScore.breakdown.dayChangeLarge && aiScore.breakdown.dayChangePositive && (
              <ScorePill label="Positive Day" />
            )}
            {aiScore.breakdown.highVolume && <ScorePill label="High Volume" />}
            {aiScore.breakdown.aboveFiftyMA && <ScorePill label="Above 50MA" />}
            {aiScore.breakdown.aboveTwoHundredMA && (
              <ScorePill label="Above 200MA" />
            )}
            {aiScore.breakdown.lowPE && <ScorePill label="Value PE" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-button p-2.5 border border-border">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text-primary mt-0.5">{value}</p>
    </div>
  );
}

function ScorePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
      {label}
    </span>
  );
}
