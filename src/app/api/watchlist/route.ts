// filepath: src/app/api/watchlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiError } from "@/types";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: { stocks: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(watchlists);
  } catch (err) {
    console.error("[/api/watchlist GET] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch watchlist", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { symbol: string; watchlistId?: string; group?: string };

    if (!body.symbol) {
      return NextResponse.json<ApiError>(
        { error: "Missing required field: symbol" },
        { status: 400 }
      );
    }

    const symbol = body.symbol.toUpperCase().trim();

    // Get or create first watchlist
    let watchlistId = body.watchlistId;
    if (!watchlistId) {
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId: session.user.id },
      });
      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: { userId: session.user.id, name: "My Watchlist" },
        });
      }
      watchlistId = watchlist.id;
    }

    const stock = await prisma.watchlistStock.upsert({
      where: { watchlistId_symbol: { watchlistId, symbol } },
      update: { group: body.group },
      create: { watchlistId, symbol, group: body.group },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (err) {
    console.error("[/api/watchlist POST] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to add stock to watchlist", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json<ApiError>(
        { error: "Missing required parameter: symbol" },
        { status: 400 }
      );
    }

    // Delete from all user's watchlists
    await prisma.watchlistStock.deleteMany({
      where: {
        symbol: symbol.toUpperCase(),
        watchlist: { userId: session.user.id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/watchlist DELETE] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to remove stock from watchlist", details: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, price, buyPrice, change, verdict, verdictText, confidence } = body;

    if (!symbol) {
      return NextResponse.json<ApiError>(
        { error: "Missing required field: symbol" },
        { status: 400 }
      );
    }

    await prisma.watchlistStock.updateMany({
      where: {
        symbol: symbol.toUpperCase(),
        watchlist: { userId: session.user.id },
      },
      data: {
        price: price !== undefined ? parseFloat(price) : undefined,
        buyPrice: buyPrice !== undefined ? parseFloat(buyPrice) : undefined,
        change: change !== undefined ? parseFloat(change) : undefined,
        verdict,
        verdictText,
        confidence: confidence !== undefined ? parseInt(confidence) : undefined,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/watchlist PATCH] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to update stock analysis", details: String(err) },
      { status: 500 }
    );
  }
}
