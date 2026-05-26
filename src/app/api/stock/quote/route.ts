import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote } from "@/lib/stocks";
import type { ApiError } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json<ApiError>(
      { error: "Missing required parameter: symbol" },
      { status: 400 }
    );
  }

  try {
    const quote = await fetchStockQuote(symbol.trim());

    if (!quote) {
      return NextResponse.json<ApiError>(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json(quote, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("[/api/stock/quote] Unexpected error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch stock quote", details: String(err) },
      { status: 500 }
    );
  }
}
