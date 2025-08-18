import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import * as jose from "jose";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { credential, username, password } = await request.json();

    if (!credential || !username || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const { sub: googleId, email, picture } = payload;

    // Check if this Google ID is already linked
    const existingGoogleUser = await prisma.user.findUnique({
      where: { googleId },
    });

    if (existingGoogleUser) {
      return NextResponse.json({ 
        error: "This Google account is already linked to another user" 
      }, { status: 400 });
    }

    // Find the existing user and verify credentials
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    if (!existingUser.password) {
      return NextResponse.json({ 
        error: "Account verification failed. Please contact support." 
      }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Link Google account to existing user
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleId,
        email: email || existingUser.email, // Update email if not set
        avatar: picture || existingUser.avatar,
        avatarType: picture ? "url" : existingUser.avatarType,
      },
    });

    // Create JWT token
    const token = await new jose.SignJWT({
      userId: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(secret);

    const response = NextResponse.json({
      message: "Google account linked successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (error) {
    console.error("Google account linking error:", error);
    return NextResponse.json(
      { error: "Account linking failed" },
      { status: 500 }
    );
  }
}