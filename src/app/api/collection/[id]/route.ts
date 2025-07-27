import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vinyl = await prisma.vinyl.findFirst({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId),
    },
    include: {
      collection: true,
    },
  });

  if (!vinyl) {
    return NextResponse.json({ error: "Vinyl not found" }, { status: 404 });
  }

  const formattedVinyl = {
    ...vinyl,
    genre: JSON.parse(vinyl.genres),
    trackList: vinyl.trackList ? JSON.parse(vinyl.trackList) : null,
  };

  return NextResponse.json(formattedVinyl);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updatedData = await request.json();

  // Only allow updating personal collection fields
  const updateFields: any = {};

  if (updatedData.condition !== undefined) {
    updateFields.condition = updatedData.condition || null;
  }

  if (updatedData.sleeveCondition !== undefined) {
    updateFields.sleeveCondition = updatedData.sleeveCondition || null;
  }

  if (updatedData.rating !== undefined) {
    updateFields.rating = updatedData.rating
      ? parseInt(updatedData.rating)
      : null;
  }

  if (updatedData.description !== undefined) {
    updateFields.description = updatedData.description || null;
  }

  if (updatedData.collectionId !== undefined) {
    updateFields.collectionId = updatedData.collectionId || null;
  }

  const updatedVinyl = await prisma.vinyl.updateMany({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId),
    },
    data: updateFields,
  });

  if (updatedVinyl.count === 0) {
    return NextResponse.json({ error: "Vinyl not found" }, { status: 404 });
  }

  const vinyl = await prisma.vinyl.findFirst({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId),
    },
    include: {
      collection: true,
    },
  });

  const formattedVinyl = {
    ...vinyl,
    genre: JSON.parse(vinyl!.genres),
    trackList: vinyl!.trackList ? JSON.parse(vinyl!.trackList) : null,
  };

  return NextResponse.json(formattedVinyl);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedVinyl = await prisma.vinyl.deleteMany({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId),
    },
  });

  if (deletedVinyl.count === 0) {
    return NextResponse.json({ error: "Vinyl not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Vinyl deleted successfully" });
}
