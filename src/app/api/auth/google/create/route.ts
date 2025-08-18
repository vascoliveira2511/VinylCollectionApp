import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import * as jose from "jose";
import { prisma } from "@/lib/db";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: "No credential provided" },
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if this Google ID is already linked
    const existingGoogleUser = await prisma.user.findUnique({
      where: { googleId },
    });

    if (existingGoogleUser) {
      return NextResponse.json({ error: "This Google account is already linked to another user" }, { status: 400 });
    }

    // Generate username from email or name
    const baseUsername = name?.replace(/\s+/g, "").toLowerCase() || email?.split("@")[0] || "user";
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        googleId,
        avatar: picture,
        avatarType: picture ? "url" : "generated",
      },
    });

    // Create default collection
    await prisma.collection.create({
      data: {
        title: "Main Collection",
        description: "Your default vinyl collection",
        isDefault: true,
        userId: user.id,
      },
    });

    // Create JWT token
    const token = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(secret);

    const response = NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
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
    console.error("Google account creation error:", error);
    return NextResponse.json(
      { error: "Account creation failed" },
      { status: 500 }
    );
  }
}