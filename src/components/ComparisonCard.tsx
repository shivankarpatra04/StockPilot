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
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Check,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import type { StockQuote, AIScore } from "@/types";
import type { StockInsights } from "@/lib/compare";

interface ComparisonCardProps {
  quote: StockQuote;
  aiScore: AIScore;
  rank?: number;
  isWinner?: boolean;
  insights?: StockInsights;
  /** Which metric rows this stock wins (best value across the comparison). */
  metricWins?: { pe?: boolean; revGrowth?: boolean };
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

export default function ComparisonCard({
  quote,
  aiScore,
  rank,
  isWinner,
  insights,
  metricWins,
}: ComparisonCardProps) {
  const changePercent = quote.regularMarketChangePercent;
  const changeColor = getChangeColor(changePercent);
  const TrendIcon =
    changePercent > 0 ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;

  return (
    <Card
      className={`relative transition-all duration-300 animate-slide-up ${
        isWinner
          ? "border-secondary/60 shadow-glow ring-1 ring-secondary/40"
          : "hover:border-primary/40 hover:shadow-glow"
      }`}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div
          className={`absolute -top-2.5 -left-2.5 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-md ${
            isWinner
              ? "bg-secondary text-white"
              : "bg-surface border border-border text-text-muted"
          }`}
        >
          {isWinner ? <Crown className="w-3.5 h-3.5" /> : null}
          {isWinner ? "Top Pick" : `#${rank}`}
        </div>
      )}

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
        <Badge variant={labelVariant[aiScore.label]} className="w-fit mt-1">
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
          <MetricRow
            label="P/E Ratio"
            value={quote.trailingPE ? quote.trailingPE.toFixed(1) : "N/A"}
            best={metricWins?.pe}
          />
          <MetricRow
            label="Market Cap"
            value={formatLargeNumber(quote.marketCap, getCurrencySymbol(quote.currency))}
          />
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
            best={metricWins?.revGrowth}
          />
        </div>

        {/* Strengths */}
        {insights && insights.strengths.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-secondary" /> Strengths
            </p>
            <ul className="space-y-1">
              {insights.strengths.map((s) => (
                <li key={s} className="flex items-start gap-1.5 text-xs text-text-primary">
                  <Check className="w-3 h-3 text-secondary flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {insights && insights.weaknesses.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Weaknesses
            </p>
            <ul className="space-y-1">
              {insights.weaknesses.map((s) => (
                <li key={s} className="flex items-start gap-1.5 text-xs text-text-muted">
                  <Minus className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk flags */}
        {insights && insights.risks.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1.5">
              {insights.risks.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-danger/15 text-danger border border-danger/30"
                >
                  <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  best,
}: {
  label: string;
  value: string;
  best?: boolean;
}) {
  return (
    <div
      className={`rounded-button p-2.5 border ${
        best
          ? "bg-secondary/10 border-secondary/40"
          : "bg-surface border-border"
      }`}
    >
      <p className="text-xs text-text-muted flex items-center gap-1">
        {label}
        {best && <Check className="w-3 h-3 text-secondary" />}
      </p>
      <p
        className={`text-sm font-semibold mt-0.5 ${
          best ? "text-secondary" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
