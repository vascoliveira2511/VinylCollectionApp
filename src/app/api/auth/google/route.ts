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

    if (!email || !googleId) {
      return NextResponse.json(
        { error: "Missing required Google account information" },
        { status: 400 }
      );
    }

    // Check if user exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    // If not found by Google ID, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      // If user exists with email but no Google ID, link the accounts
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar: picture || user.avatar,
            avatarType: picture ? "url" : user.avatarType,
          },
        });
      }
    }

    // If user still doesn't exist, create a new one
    if (!user) {
      // Generate username from email or name
      const baseUsername =
        name?.replace(/\s+/g, "").toLowerCase() || email.split("@")[0];
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username,
          email,
          googleId,
          avatar: picture,
          avatarType: picture ? "url" : "generated",
        },
      });

      // Create default collection for new user
      await prisma.collection.create({
        data: {
          title: "Main Collection",
          description: "Your default vinyl collection",
          isDefault: true,
          userId: user.id,
        },
      });
    }

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
      message: "Login successful",
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
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}