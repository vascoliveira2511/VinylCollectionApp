import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // Verify the collection exists and belongs to the user
    const collection = await prisma.collection.findFirst({
      where: {
        id: parseInt(collectionId),
        userId: parseInt(userId),
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Remove default status from all collections for this user
    await prisma.collection.updateMany({
      where: {
        userId: parseInt(userId),
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set the new collection as default
    await prisma.collection.update({
      where: {
        id: parseInt(collectionId),
      },
      data: {
        isDefault: true,
      },
    });

    return NextResponse.json({
      message: "Default collection updated successfully",
    });
  } catch (error) {
    console.error("Error setting default collection:", error);
    return NextResponse.json(
      { error: "Failed to set default collection" },
      { status: 500 }
    );
  }
}
