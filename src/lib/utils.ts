// filepath: src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | null,
  currency: string = "INR"
): string {
  if (value === null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number | null, symbol: string = "$"): string {
  if (value === null || isNaN(value)) return "N/A";
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  return `${symbol}${value.toLocaleString()}`;
}

export function formatVolume(value: number | null): string {
  if (value === null || isNaN(value)) return "N/A";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
}

export function formatPercent(value: number | null): string {
  if (value === null || isNaN(value)) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-secondary";
  if (value < 0) return "text-danger";
  return "text-text-muted";
}

export function getCurrencySymbol(currency: string = "USD"): string {
  try {
    return (0)
      .toLocaleString("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/\d/g, "")
      .trim();
  } catch (e) {
    return currency === "INR" ? "₹" : "$";
  }
}
