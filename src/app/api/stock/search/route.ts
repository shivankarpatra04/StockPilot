// filepath: src/app/api/stock/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/stocks";
import type { ApiError } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json<ApiError>(
      { error: "Missing required parameter: q" },
      { status: 400 }
    );
  }

  try {
    const results = await searchSymbols(query);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[/api/stock/search] Unexpected error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to search stocks", details: String(err) },
      { status: 500 }
    );
  }
}
