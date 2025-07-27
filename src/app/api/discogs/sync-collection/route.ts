import { NextRequest, NextResponse } from "next/server";
import { createDiscogsOAuth } from "@/lib/discogs-oauth";
import { prisma } from "@/lib/db";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface DiscogsCollectionItem {
  id: number;
  instance_id: number;
  date_added: string;
  rating: number;
  basic_information: {
    id: number;
    master_id: number;
    master_url: string;
    resource_url: string;
    title: string;
    year: number;
    formats: Array<{
      name: string;
      qty: string;
      descriptions?: string[];
    }>;
    artists: Array<{
      name: string;
      anv: string;
      join: string;
      role: string;
      tracks: string;
      id: number;
      resource_url: string;
    }>;
    labels: Array<{
      name: string;
      catno: string;
      entity_type: string;
      entity_type_name: string;
      id: number;
      resource_url: string;
    }>;
    genres: string[];
    styles: string[];
    thumb: string;
    cover_image: string;
    country?: string;
  };
}

interface DiscogsCollectionResponse {
  pagination: {
    pages: number;
    page: number;
    per_page: number;
    items: number;
    urls: {
      next?: string;
      prev?: string;
    };
  };
  releases: DiscogsCollectionItem[];
}

// Helper function to fetch full release details from Discogs
async function fetchReleaseDetails(
  discogs: any,
  releaseId: number,
  accessToken: string,
  accessTokenSecret: string
): Promise<{
  country?: string;
  tracklist?: any[];
  notes?: string;
  barcode?: string[];
  masterId?: number;
  images?: any[];
  formatDescriptions?: string[];
  communityRating?: number;
  dataQuality?: string;
} | null> {
  try {
    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
    const response = await discogs.makeAuthenticatedRequest(
      releaseUrl,
      "GET",
      accessToken,
      accessTokenSecret
    );

    if (response.ok) {
      const releaseData = await response.json();
      
      // Extract format descriptions for richer format info
      const formatDescriptions = releaseData.formats?.[0]?.descriptions || [];
      
      // Get the best quality image (primary image or first image)
      const primaryImage = releaseData.images?.find((img: any) => img.type === "primary");
      const bestImage = primaryImage || releaseData.images?.[0];
      
      return {
        country: releaseData.country || null,
        tracklist: releaseData.tracklist || null,
        notes: releaseData.notes || null,
        barcode: releaseData.barcode || null,
        masterId: releaseData.master_id || null,
        images: releaseData.images || null,
        formatDescriptions: formatDescriptions,
        communityRating: releaseData.community?.rating?.average || null,
        dataQuality: releaseData.data_quality || null,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch release details for ${releaseId}:`, error);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from JWT
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jose.jwtVerify(token, secret);
    const userId = parseInt(payload.userId as string);

    // Get user's Discogs OAuth tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discogsAccessToken: true,
        discogsAccessTokenSecret: true,
        discogsUsername: true,
      },
    });

    if (
      !user?.discogsAccessToken ||
      !user?.discogsAccessTokenSecret ||
      !user?.discogsUsername
    ) {
      return NextResponse.json(
        { error: "Discogs account not connected" },
        { status: 400 }
      );
    }

    const discogs = createDiscogsOAuth();
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Get or create default collection
    let collection = await prisma.collection.findFirst({
      where: { userId, isDefault: true },
    });

    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          title: "Discogs Collection",
          description: "Synced from Discogs",
          userId,
          isDefault: true,
          isPublic: false,
        },
      });
    }

    // Fetch collection from Discogs API with pagination
    let page = 1;
    const perPage = 50; // Discogs API limit
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const collectionUrl = `https://api.discogs.com/users/${user.discogsUsername}/collection/folders/0/releases?page=${page}&per_page=${perPage}`;

        const response = await discogs.makeAuthenticatedRequest(
          collectionUrl,
          "GET",
          user.discogsAccessToken,
          user.discogsAccessTokenSecret
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Discogs API error: ${response.status} - ${errorText}`
          );
        }

        const data: DiscogsCollectionResponse = await response.json();

        // Process each release
        for (const item of data.releases) {
          try {
            const release = item.basic_information;
            const artist =
              release.artists.map((a) => a.name).join(", ") || "Unknown Artist";

            // Fetch full release details to get country and other missing fields
            const releaseDetails = await fetchReleaseDetails(
              discogs,
              release.id,
              user.discogsAccessToken,
              user.discogsAccessTokenSecret
            );

            // Small delay to respect Discogs rate limits (60 req/min)
            await new Promise((resolve) => setTimeout(resolve, 1100));

            // Check for existing records - first by Discogs ID, then by artist/title similarity
            let existingVinyl = await prisma.vinyl.findFirst({
              where: {
                userId,
                discogsId: release.id,
              },
            });

            // If no exact Discogs ID match, check for similar records by artist and title
            if (!existingVinyl) {
              const similarVinyls = await prisma.vinyl.findMany({
                where: {
                  userId,
                  AND: [
                    {
                      artist: {
                        contains: artist.split(",")[0].trim(),
                        mode: "insensitive",
                      },
                    },
                    {
                      title: {
                        contains: release.title
                          .split(" ")
                          .slice(0, 3)
                          .join(" "),
                        mode: "insensitive",
                      },
                    },
                    { discogsId: null }, // Only match records without Discogs ID
                  ],
                },
              });

              // Find the best match
              if (similarVinyls.length > 0) {
                existingVinyl =
                  similarVinyls.find(
                    (vinyl) =>
                      vinyl.artist
                        .toLowerCase()
                        .includes(artist.toLowerCase().split(",")[0].trim()) &&
                      vinyl.title
                        .toLowerCase()
                        .includes(release.title.toLowerCase().slice(0, 20))
                  ) || similarVinyls[0];
              }
            }

            if (existingVinyl) {
              // Update existing record with Discogs information if it doesn't have it
              if (!existingVinyl.discogsId) {
                await prisma.vinyl.update({
                  where: { id: existingVinyl.id },
                  data: {
                    discogsId: release.id,
                    // Only update fields that are null or empty
                    imageUrl:
                      existingVinyl.imageUrl ||
                      release.cover_image ||
                      release.thumb ||
                      null,
                    genres:
                      existingVinyl.genres === "[]"
                        ? JSON.stringify(release.genres || [])
                        : existingVinyl.genres,
                    label:
                      existingVinyl.label || release.labels?.[0]?.name || null,
                    format:
                      existingVinyl.format ||
                      release.formats?.[0]?.name ||
                      null,
                    catalogNumber:
                      existingVinyl.catalogNumber ||
                      release.labels?.[0]?.catno ||
                      null,
                    country:
                      existingVinyl.country || releaseDetails?.country || null,
                    trackList:
                      existingVinyl.trackList || 
                      (releaseDetails?.tracklist ? JSON.stringify(releaseDetails.tracklist) : null),
                    description: existingVinyl.description || null,
                    year: existingVinyl.year || release.year || null,
                    rating: existingVinyl.rating || item.rating || null,
                  },
                });
                syncedCount++;
              }
            } else {
              // Create new vinyl record
              await prisma.vinyl.create({
                data: {
                  discogsId: release.id,
                  artist,
                  title: release.title,
                  year: release.year || null,
                  imageUrl: release.cover_image || release.thumb || null,
                  genres: JSON.stringify(release.genres || []),
                  label: release.labels?.[0]?.name || null,
                  format: release.formats?.[0]?.name || null,
                  catalogNumber: release.labels?.[0]?.catno || null,
                  country: releaseDetails?.country || null,
                  trackList: releaseDetails?.tracklist ? JSON.stringify(releaseDetails.tracklist) : null,
                  description: null,
                  rating: item.rating || null,
                  userId,
                  collectionId: collection.id,
                },
              });
              syncedCount++;
            }
          } catch (itemError) {
            console.error(
              "Error processing item:",
              item.basic_information.id,
              itemError
            );
            errorCount++;
            errors.push(
              `Failed to sync release "${item.basic_information.title}": ${
                itemError instanceof Error ? itemError.message : "Unknown error"
              }`
            );
          }
        }

        // Check if there are more pages
        hasMorePages = page < data.pagination.pages;
        page++;

        // Rate limiting: wait 1 second between requests (60 req/min limit)
        if (hasMorePages) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (pageError) {
        console.error("Error fetching page:", page, pageError);
        errors.push(
          `Failed to fetch page ${page}: ${
            pageError instanceof Error ? pageError.message : "Unknown error"
          }`
        );
        break;
      }
    }

    return NextResponse.json({
      message: "Collection sync completed",
      syncedCount,
      errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors only
    });
  } catch (error) {
    console.error("Collection sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync collection from Discogs" },
      { status: 500 }
    );
  }
}
