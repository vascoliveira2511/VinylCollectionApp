import { NextResponse } from "next/server";
import * as jose from "jose";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify the current token (even if expired, we can still extract the payload)
    let payload;
    try {
      const { payload: validPayload } = await jose.jwtVerify(token, secret);
      payload = validPayload;
    } catch (error: any) {
      // If token is expired but still valid JWT, extract payload
      if (error.code === "ERR_JWT_EXPIRED") {
        const decoded = jose.decodeJwt(token);
        payload = decoded;
      } else {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Create new token with extended expiration
    const newToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h") // Longer expiration for refresh
      .sign(secret);

    const response = NextResponse.json({ message: "Token refreshed" });
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}
