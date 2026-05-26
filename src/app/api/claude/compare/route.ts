export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import type { ClaudeResponse, ApiError } from "@/types";

interface CompareRequestBody {
  symbols: string[];
  scores: number[];
  days?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CompareRequestBody;

    if (
      !body.symbols ||
      !body.scores ||
      body.symbols.length === 0 ||
      body.symbols.length !== body.scores.length
    ) {
      return NextResponse.json<ApiError>(
        {
          error:
            "Invalid request: symbols and scores arrays must be non-empty and equal length",
        },
        { status: 400 }
      );
    }

    // Algorithmic comparison instead of AI
    let bestIdx = 0;
    for (let i = 1; i < body.scores.length; i++) {
        if (body.scores[i] > body.scores[bestIdx]) bestIdx = i;
    }
    const bestSymbol = body.symbols[bestIdx];
    
    const text = `Based on recent data analysis over a ${body.days || 30}-day horizon, ${bestSymbol} appears to be the strongest pick among the group. It currently holds the highest technical score of ${body.scores[bestIdx]}, showing better momentum and relative strength compared to its peers.`;

    return NextResponse.json<ClaudeResponse>({ text });
  } catch (err) {
    console.error("[/api/claude/compare] Error:", err);
    return NextResponse.json<ClaudeResponse>(
      {
        text: "AI comparison verdict temporarily unavailable.",
        error: String(err),
      },
      { status: 200 }
    );
  }
}
