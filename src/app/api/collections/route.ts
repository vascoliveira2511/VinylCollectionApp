import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function ensureProtectedCollections(userId: number) {
  // Check if user has Collection and Wantlist
  const existingCollections = await prisma.collection.findMany({
    where: {
      userId: userId,
      type: { in: ["collection", "wantlist"] },
    },
  });

  const hasCollection = existingCollections.some(c => c.type === "collection");
  const hasWantlist = existingCollections.some(c => c.type === "wantlist");

  const collectionsToCreate = [];

  if (!hasCollection) {
    collectionsToCreate.push({
      title: "Collection",
      description: "Your main vinyl collection",
      userId: userId,
      type: "collection",
      isProtected: true,
      isDefault: true,
      isPublic: false,
    });
  }

  if (!hasWantlist) {
    collectionsToCreate.push({
      title: "Wantlist",
      description: "Albums you want to own",
      userId: userId,
      type: "wantlist",
      isProtected: true,
      isDefault: false,
      isPublic: false,
    });
  }

  if (collectionsToCreate.length > 0) {
    await prisma.collection.createMany({
      data: collectionsToCreate,
    });
  }
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure protected collections exist
    await ensureProtectedCollections(parseInt(userId));

    const collections = await prisma.collection.findMany({
      where: { userId: parseInt(userId) },
      include: {
        vinyls: true,
        _count: {
          select: { vinyls: true },
        },
      },
      orderBy: [
        { type: "asc" }, // collection, wantlist, then custom
        { isDefault: "desc" }, 
        { createdAt: "asc" }
      ],
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, imageUrl, color, isPublic } =
      await request.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Collection title is required" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        color: color || null,
        isPublic: isPublic || false,
        userId: parseInt(userId),
        isDefault: false,
      },
      include: {
        _count: {
          select: { vinyls: true },
        },
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
