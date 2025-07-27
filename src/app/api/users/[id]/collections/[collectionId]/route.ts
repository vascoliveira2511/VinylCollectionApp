import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get a specific collection from a user (for friends)
export async function GET(
  request: Request,
  { params }: { params: { id: string; collectionId: string } }
) {
  const currentUserId = request.headers.get("x-user-id");
  const targetUserId = parseInt(params.id);
  const collectionId = parseInt(params.collectionId);

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if users are friends or if it's the same user
    if (parseInt(currentUserId) !== targetUserId) {
      const friendship = await prisma.friend.findFirst({
        where: {
          OR: [
            {
              senderId: parseInt(currentUserId),
              receiverId: targetUserId,
              status: "accepted",
            },
            {
              receiverId: parseInt(currentUserId),
              senderId: targetUserId,
              status: "accepted",
            },
          ],
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: "Not authorized to view this collection" },
          { status: 403 }
        );
      }
    }

    // Get the specific collection
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: targetUserId,
        ...(parseInt(currentUserId) !== targetUserId ? { isPublic: true } : {}),
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
        vinyls: {
          select: {
            id: true,
            artist: true,
            title: true,
            year: true,
            imageUrl: true,
            genres: true,
            discogsId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedCollection = {
      ...collection,
      vinyls: collection.vinyls.map((vinyl) => ({
        ...vinyl,
        genre: JSON.parse(vinyl.genres),
      })),
    };

    return NextResponse.json(formattedCollection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}
