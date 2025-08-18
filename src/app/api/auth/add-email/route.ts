import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Dynamically import prisma to avoid build-time issues
    const { prisma } = await import("@/lib/db");
    
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email) {
      return NextResponse.json({ error: "User already has an email address" }, { status: 400 });
    }

    // Check if email is already taken
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered by another user" }, { status: 400 });
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        emailVerificationToken,
        emailVerified: false,
      },
    });

    // Send verification email
    try {
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the process if email fails - user can request new verification
    }

    return NextResponse.json({ 
      message: "Email added successfully! Please check your email to verify your account.",
      requiresVerification: true
    });
  } catch (error) {
    console.error("Add email error:", error);
    return NextResponse.json({ error: "Failed to add email" }, { status: 500 });
  }
}