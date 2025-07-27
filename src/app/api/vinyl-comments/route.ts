import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discogsId = searchParams.get("discogsId");

  if (!discogsId) {
    return NextResponse.json({ error: "Discogs ID is required" }, { status: 400 });
  }

  try {
    const comments = await prisma.vinylComment.findMany({
      where: {
        discogsId: parseInt(discogsId),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            avatarType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discogsId, content, rating, isReview } = await request.json();

  if (!discogsId || !content) {
    return NextResponse.json(
      { error: "Discogs ID and content are required" },
      { status: 400 }
    );
  }

  if (rating && (rating < 1 || rating > 5)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  try {
    const comment = await prisma.vinylComment.create({
      data: {
        userId: parseInt(userId),
        discogsId: parseInt(discogsId),
        content: content,
        rating: rating || null,
        isReview: isReview || false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            avatarType: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}