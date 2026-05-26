// filepath: src/components/ScoreBarChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartDataPoint {
  symbol: string;
  score: number;
}

interface ScoreBarChartProps {
  data: ChartDataPoint[];
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const scoreLabel =
      score >= 80
        ? "Strong Buy"
        : score >= 60
        ? "Bullish"
        : score >= 40
        ? "Neutral"
        : "Caution";

    return (
      <div className="bg-card border border-border rounded-card p-3 shadow-card">
        <p className="font-bold text-text-primary text-sm">{label}</p>
        <p className="text-primary font-semibold">Score: {score}</p>
        <p className="text-text-muted text-xs">{scoreLabel}</p>
      </div>
    );
  }
  return null;
}

function getBarColor(score: number): string {
  if (score >= 80) return "#00D4AA";
  if (score >= 50) return "#FACC15";
  return "#FF4757";
}

export default function ScoreBarChart({ data }: ScoreBarChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
          <XAxis
            dataKey="symbol"
            tick={{ fill: "#8B8BA8", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#2A2A3A" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#8B8BA8", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A3A" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2A2A3A50" }} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.score)}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
