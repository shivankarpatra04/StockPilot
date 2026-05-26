// filepath: src/components/AIScoreBadge.tsx
import { cn } from "@/lib/utils";
import type { AIScore } from "@/types";

interface AIScoreBadgeProps {
  score: number;
  label?: AIScore["label"];
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function AIScoreBadge({
  score,
  label,
  size = "md",
  showLabel = true,
  className,
}: AIScoreBadgeProps) {
  const colorClass =
    score >= 80
      ? "bg-secondary/20 text-secondary border-secondary/40"
      : score >= 50
      ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/40"
      : "bg-danger/20 text-danger border-danger/40";

  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-bold",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        colorClass,
        sizeClass,
        className
      )}
    >
      <span>{score}</span>
      {showLabel && label && (
        <span className="opacity-80">{label}</span>
      )}
    </div>
  );
}

interface AIScoreRingProps {
  score: number;
  size?: number;
}

export function AIScoreRing({ score, size = 80 }: AIScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80 ? "#00D4AA" : score >= 50 ? "#FACC15" : "#FF4757";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A3A"
          strokeWidth="6"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-lg font-bold"
          style={{ color: strokeColor }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
