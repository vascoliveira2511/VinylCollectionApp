import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Search for users by username
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    // Search for users excluding the current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: parseInt(userId) } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        avatarType: true,
      },
      take: 10, // Limit results
    });

    // Get existing friend relationships for these users
    const userIds = users.map((user) => user.id);
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { senderId: parseInt(userId), receiverId: { in: userIds } },
          { receiverId: parseInt(userId), senderId: { in: userIds } },
        ],
      },
    });

    // Add friendship status to each user
    const usersWithStatus = users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.senderId === parseInt(userId) && f.receiverId === user.id) ||
          (f.receiverId === parseInt(userId) && f.senderId === user.id)
      );

      let friendshipStatus = "none";
      if (friendship) {
        if (friendship.status === "accepted") {
          friendshipStatus = "friends";
        } else if (friendship.senderId === parseInt(userId)) {
          friendshipStatus = "sent";
        } else {
          friendshipStatus = "received";
        }
      }

      return {
        ...user,
        friendshipStatus,
      };
    });

    return NextResponse.json(usersWithStatus);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
