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
    const { symbol, condition, targetPrice } = body;

    if (!symbol || !condition || targetPrice === undefined) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        condition,
        targetPrice: parseFloat(targetPrice),
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
    const { id, triggered } = body;

    if (!id || triggered === undefined) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        triggered,
        triggeredAt: triggered ? new Date() : null,
      },
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
