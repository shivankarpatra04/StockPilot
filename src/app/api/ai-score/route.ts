// filepath: src/app/api/ai-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { computeAIScore } from "@/lib/ai-score";
import type { StockQuote, AIScore, ApiError } from "@/types";

interface AIScoreRequestBody {
  symbol: string;
  quoteData: StockQuote;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as AIScoreRequestBody;

    if (!body.symbol || !body.quoteData) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields: symbol, quoteData" },
        { status: 400 }
      );
    }

    const score = computeAIScore(body.quoteData);

    return NextResponse.json<AIScore>(score);
  } catch (err) {
    console.error("[/api/ai-score] Error computing score:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to compute AI score", details: String(err) },
      { status: 500 }
    );
  }
}
