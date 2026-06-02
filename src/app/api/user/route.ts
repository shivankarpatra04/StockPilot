export const dynamic = "force-dynamic";

// filepath: src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiError } from "@/types";

export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiError>(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cascades to watchlists, watchlist stocks, and alerts via schema relations.
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("[/api/user DELETE] Error:", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to delete account", details: String(err) },
      { status: 500 }
    );
  }
}
