export const dynamic = "force-dynamic";

// filepath: src/app/api/user/profile/route.ts
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, plan: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("[/api/user/profile GET] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch profile", details: String(err) },
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
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json<ApiError>(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (name.length > 60) {
      return NextResponse.json<ApiError>(
        { error: "Name must be 60 characters or fewer" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, email: true, name: true, plan: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[/api/user/profile PATCH] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to update profile", details: String(err) },
      { status: 500 }
    );
  }
}
