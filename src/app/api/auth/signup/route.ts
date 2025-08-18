import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { username, email, password } = await request.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      emailVerificationToken,
    },
  });

  // Create default collection
  await prisma.collection.create({
    data: {
      title: "Main Collection",
      description: "Your default vinyl collection",
      isDefault: true,
      userId: newUser.id,
    },
  });

  // TODO: Send verification email here
  // For now, we'll return success but in production you'd send an email

  return NextResponse.json({ 
    message: "Account created successfully! Please check your email to verify your account.",
    requiresVerification: true 
  });
}
