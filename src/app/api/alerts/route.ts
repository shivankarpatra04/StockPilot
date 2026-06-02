export const dynamic = "force-dynamic";

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

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (err) {
    console.error("[/api/alerts GET] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch alerts", details: String(err) },
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

    const body = await request.json();
    const { symbol, condition, targetPrice, alertType, note } = body;

    if (!symbol || !condition || targetPrice === undefined) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (condition !== "above" && condition !== "below") {
      return NextResponse.json<ApiError>(
        { error: "condition must be 'above' or 'below'" },
        { status: 400 }
      );
    }

    const ALLOWED_TYPES = ["TARGET", "STOP_LOSS", "BUY_ZONE", "SELL_ZONE", "CUSTOM"];
    const type = ALLOWED_TYPES.includes(alertType) ? alertType : "CUSTOM";

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json<ApiError>(
        { error: "targetPrice must be a positive number" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        condition,
        alertType: type,
        note: typeof note === "string" ? note.slice(0, 200) : null,
        targetPrice: price,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    console.error("[/api/alerts POST] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to create alert", details: String(err) },
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiError>(
        { error: "Missing alert ID" },
        { status: 400 }
      );
    }

    await prisma.alert.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/alerts DELETE] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to delete alert", details: String(err) },
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
    const { id, triggered, seen, markAllSeen } = body;

    // Mark every triggered alert as seen (used when the user opens the notification panel).
    if (markAllSeen) {
      await prisma.alert.updateMany({
        where: { userId: session.user.id, triggered: true, seen: false },
        data: { seen: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!id || (triggered === undefined && seen === undefined)) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const data: { triggered?: boolean; triggeredAt?: Date | null; seen?: boolean } = {};
    if (triggered !== undefined) {
      data.triggered = triggered;
      data.triggeredAt = triggered ? new Date() : null;
    }
    if (seen !== undefined) {
      data.seen = seen;
    }

    const alert = await prisma.alert.update({
      where: {
        id,
        userId: session.user.id,
      },
      data,
    });

    return NextResponse.json(alert);
  } catch (err) {
    console.error("[/api/alerts PATCH] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to update alert", details: String(err) },
      { status: 500 }
    );
  }
}
