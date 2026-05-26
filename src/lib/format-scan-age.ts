// Renders a "Data as of X ago" stamp shared between Best Trade and Opportunities
// so the user can verify both sections are showing the same data snapshot.
export function formatScanAge(timestampMs: number | null | undefined): string {
  if (!timestampMs || timestampMs <= 0) return "Just now";
  const diffMs = Date.now() - timestampMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function isScanStale(timestampMs: number | null | undefined, hoursThreshold = 6): boolean {
  if (!timestampMs || timestampMs <= 0) return true;
  return Date.now() - timestampMs > hoursThreshold * 3600_000;
}
