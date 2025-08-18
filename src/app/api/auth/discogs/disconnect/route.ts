import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: NextRequest) {
  const { prisma } = await import("@/lib/db");
  try {
    // Get current user from JWT
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Remove Discogs OAuth tokens from database
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        discogsAccessToken: null,
        discogsAccessTokenSecret: null,
        discogsUsername: null,
      },
    });

    return NextResponse.json({
      message: "Discogs account disconnected successfully",
    });
  } catch (error) {
    console.error("Discogs disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Discogs account" },
      { status: 500 }
    );
  }
}
