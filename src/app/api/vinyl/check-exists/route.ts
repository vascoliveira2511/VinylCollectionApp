import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const discogsId = searchParams.get("discogsId");

  if (!discogsId) {
    return NextResponse.json({ error: "Discogs ID is required" }, { status: 400 });
  }

  try {
    const existingVinyls = await prisma.vinyl.findMany({
      where: {
        userId: parseInt(userId),
        discogsId: parseInt(discogsId),
      },
      include: {
        collection: {
          select: {
            id: true,
            title: true,
            isDefault: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(existingVinyls);
  } catch (error) {
    console.error("Check vinyl exists error:", error);
    return NextResponse.json(
      { error: "Failed to check vinyl existence" },
      { status: 500 }
    );
  }
}