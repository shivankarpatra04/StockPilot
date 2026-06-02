export const dynamic = "force-dynamic";
export const maxDuration = 300; // runs the full pipeline (scan ~336 stocks -> generate -> validate)

import { NextRequest, NextResponse } from "next/server";
import { GET as scanStocks } from "../scan-stocks/route";
import { GET as generateOpportunities } from "../../opportunities/route";
import { GET as validateSignals } from "../validate-signals/route";

// Single entry point for the daily pipeline so any external scheduler
// (platform cron, cron-job.org, GitHub Actions, crontab + curl) can drive the
// whole flow by hitting ONE url. Stages run sequentially, in order:
//   1. scan-stocks      -> refresh live prices into the cache
//   2. opportunities    -> create new ACTIVE signals from the fresh prices
//   3. validate-signals -> resolve active signals against live candles
export async function GET(request: NextRequest) {
  // Optional protection: if CRON_SECRET is set, require a matching bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const stages: Record<string, unknown> = {};

  async function runStage(name: string, fn: () => Promise<Response>) {
    const t0 = Date.now();
    try {
      const res = await fn();
      const body = await res.json().catch(() => null);
      stages[name] = { ok: res.ok, status: res.status, durationMs: Date.now() - t0, result: body };
    } catch (err) {
      stages[name] = { ok: false, durationMs: Date.now() - t0, error: String(err) };
    }
  }

  // 1. Refresh prices.
  await runStage("scan", () => scanStocks());

  // 2. Generate new signals from the freshly scanned prices.
  const oppUrl = new URL("/api/opportunities?days=30", request.url);
  await runStage("generate", () => generateOpportunities(new NextRequest(oppUrl)));

  // 3. Resolve active signals against live candles.
  await runStage("validate", () => validateSignals());

  return NextResponse.json({
    success: true,
    totalDurationMs: Date.now() - startedAt,
    stages,
  });
}
