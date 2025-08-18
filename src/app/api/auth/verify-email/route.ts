import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prisma } = await import("@/lib/db");
    
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 200 });
    }

    // Mark email as verified and remove verification token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail(updatedUser.email!, updatedUser.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

// Handle GET requests for email verification links
export async function GET(request: Request) {
  try {
    const { prisma } = await import("@/lib/db");
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 200 });
    }

    // Mark email as verified and remove verification token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail(updatedUser.email!, updatedUser.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
  }
}