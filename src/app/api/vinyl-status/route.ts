import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discogsId, status } = await request.json();

  if (!discogsId) {
    return NextResponse.json(
      { error: "Discogs ID is required" },
      { status: 400 }
    );
  }

  try {
    if (status === null) {
      // Remove status
      await prisma.userVinylStatus.deleteMany({
        where: {
          userId: parseInt(userId),
          discogsId: discogsId,
        },
      });
    } else {
      // Upsert status
      await prisma.userVinylStatus.upsert({
        where: {
          userId_discogsId: {
            userId: parseInt(userId),
            discogsId: discogsId,
          },
        },
        create: {
          userId: parseInt(userId),
          discogsId: discogsId,
          status: status,
        },
        update: {
          status: status,
        },
      });

      // If status is "want", add to wantlist collection
      if (status === "want") {
        // Find wantlist collection (should exist from ensureProtectedCollections)
        const wantlistCollection = await prisma.collection.findFirst({
          where: {
            userId: parseInt(userId),
            type: "wantlist",
          },
        });

        if (!wantlistCollection) {
          return NextResponse.json(
            { error: "Wantlist collection not found" },
            { status: 500 }
          );
        }

        // Check if vinyl already exists in collection
        const existingVinyl = await prisma.vinyl.findFirst({
          where: {
            userId: parseInt(userId),
            discogsId: discogsId,
            collectionId: wantlistCollection.id,
          },
        });

        let createdVinyl = existingVinyl;
        if (!existingVinyl) {
          // Fetch release details from Discogs to create vinyl record
          try {
            const discogsResponse = await fetch(
              `/api/discogs/release/${discogsId}`
            );
            if (discogsResponse.ok) {
              const releaseData = await discogsResponse.json();

              createdVinyl = await prisma.vinyl.create({
                data: {
                  discogsId: discogsId,
                  artist: releaseData.artists?.[0]?.name || "Unknown Artist",
                  title: releaseData.title || "Unknown Title",
                  year: releaseData.year || null,
                  imageUrl:
                    releaseData.images?.[0]?.uri500 ||
                    releaseData.images?.[0]?.uri ||
                    null,
                  genres: JSON.stringify(releaseData.genres || []),
                  label: releaseData.labels?.[0]?.name || null,
                  format: releaseData.formats?.[0]?.name || null,
                  country: releaseData.country || null,
                  catalogNumber: releaseData.labels?.[0]?.catno || null,
                  userId: parseInt(userId),
                  collectionId: wantlistCollection.id,
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
            }
          } catch (error) {
            console.error(
              "Failed to fetch release details for wantlist:",
              error
            );
          }
        }

        return NextResponse.json({
          success: true,
          vinyl: createdVinyl,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vinyl status error:", error);
    return NextResponse.json(
      { error: "Failed to update vinyl status" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const discogsId = searchParams.get("discogsId");

  if (!discogsId) {
    return NextResponse.json(
      { error: "Discogs ID is required" },
      { status: 400 }
    );
  }

  try {
    const status = await prisma.userVinylStatus.findUnique({
      where: {
        userId_discogsId: {
          userId: parseInt(userId),
          discogsId: parseInt(discogsId),
        },
      },
    });

    return NextResponse.json({ status: status?.status || null });
  } catch (error) {
    console.error("Get vinyl status error:", error);
    return NextResponse.json(
      { error: "Failed to get vinyl status" },
      { status: 500 }
    );
  }
}
