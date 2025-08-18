import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  const { prisma } = await import("@/lib/db");
  const { username, password } = await request.json();

  // Allow login with username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username } // Allow email as username
      ]
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.password) {
    return NextResponse.json({ error: "Please use Google Sign-In for this account" }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Check if user needs to add email (legacy user)
  if (!user.email) {
    return NextResponse.json({ 
      error: "Please add an email to your account",
      needsEmail: true,
      userId: user.id 
    }, { status: 200 });
  }

  // Check if email is verified (skip for legacy users during migration)
  if (user.email && !user.emailVerified) {
    return NextResponse.json({ 
      error: "Please verify your email before logging in",
      requiresVerification: true 
    }, { status: 403 });
  }

  const token = await new jose.SignJWT({
    userId: user.id,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);

  const response = NextResponse.json({ message: "Login successful" });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24 hours
  });
  return response;
}
