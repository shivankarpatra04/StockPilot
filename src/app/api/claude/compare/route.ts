export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { isMode, type Mode } from "@/lib/lang";
import type { ClaudeResponse, ApiError } from "@/types";

interface CompareRequestBody {
  symbols: string[];
  scores: number[];
  days?: number;
  mode?: string;
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

    const mode: Mode = isMode(body.mode) ? body.mode : "expert";

    // Algorithmic comparison instead of AI
    let bestIdx = 0;
    for (let i = 1; i < body.scores.length; i++) {
        if (body.scores[i] > body.scores[bestIdx]) bestIdx = i;
    }
    const bestSymbol = body.symbols[bestIdx].split(":")[0];
    const bestScore = body.scores[bestIdx];
    const days = body.days || 30;

    const text = mode === "simple"
      ? `Pichle ${days} dino ke data ke hisaab se, in sab me se ${bestSymbol} sabse strong lag raha hai 🏆. ` +
        `Iska score sabse zyada hai (${bestScore} me se 100), matlab iski chaal baaki sab se behtar hai 📈. ` +
        `Par yaad rakhna — ye pakki tip nahi, apne advisor se zaroor poochho 🙏`
      : `Looking at the last ${days} days, ${bestSymbol} comes out as the strongest pick in this group. ` +
        `It has the highest health score (${bestScore} out of 100), which means its price trend and strength are better than the others right now. ` +
        `This is for learning only — please check with your advisor before acting.`;

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
