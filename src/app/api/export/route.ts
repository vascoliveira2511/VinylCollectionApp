import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/db";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "csv";
    const collectionId = url.searchParams.get("collectionId");

    // Build query filters
    const where: any = { userId: user.id };
    if (collectionId && collectionId !== "all") {
      where.collectionId = parseInt(collectionId);
    }

    // Fetch vinyls with collection info
    const vinyls = await db.vinyl.findMany({
      where,
      include: {
        collection: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === "json") {
      // Export as JSON
      const jsonData = vinyls.map((vinyl) => ({
        id: vinyl.id,
        artist: vinyl.artist,
        title: vinyl.title,
        year: vinyl.year,
        genres: typeof vinyl.genres === 'string' ? JSON.parse(vinyl.genres) : vinyl.genres,
        condition: vinyl.condition,
        sleeveCondition: vinyl.sleeveCondition,
        rating: vinyl.rating,
        description: vinyl.description,
        label: vinyl.label,
        format: vinyl.format,
        purchaseDate: vinyl.purchaseDate,
        purchasePrice: vinyl.purchasePrice,
        purchaseCurrency: vinyl.purchaseCurrency,
        purchaseLocation: vinyl.purchaseLocation,
        catalogNumber: vinyl.catalogNumber,
        country: vinyl.country,
        discogsId: vinyl.discogsId,
        imageUrl: vinyl.imageUrl,
        collection: vinyl.collection?.title || "Default",
        collectionType: vinyl.collection?.type || "collection",
        createdAt: vinyl.createdAt,
        updatedAt: vinyl.updatedAt,
      }));

      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalRecords: vinyls.length,
        records: jsonData,
      }, {
        headers: {
          'Content-Disposition': `attachment; filename="vinyl-collection-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      // Export as CSV
      const csvHeaders = [
        "Artist",
        "Title", 
        "Year",
        "Genres",
        "Condition",
        "Sleeve Condition",
        "Rating",
        "Description",
        "Label",
        "Format",
        "Purchase Date",
        "Purchase Price",
        "Purchase Currency",
        "Purchase Location",
        "Catalog Number",
        "Country",
        "Discogs ID",
        "Image URL",
        "Collection",
        "Collection Type",
        "Date Added",
      ].join(",");

      const csvRows = vinyls.map((vinyl) => {
        const genres = typeof vinyl.genres === 'string' ? JSON.parse(vinyl.genres) : vinyl.genres;
        return [
          `"${vinyl.artist?.replace(/"/g, '""') || ""}"`,
          `"${vinyl.title?.replace(/"/g, '""') || ""}"`,
          vinyl.year || "",
          `"${Array.isArray(genres) ? genres.join("; ") : ""}"`,
          `"${vinyl.condition || ""}"`,
          `"${vinyl.sleeveCondition || ""}"`,
          vinyl.rating || "",
          `"${vinyl.description?.replace(/"/g, '""') || ""}"`,
          `"${vinyl.label?.replace(/"/g, '""') || ""}"`,
          `"${vinyl.format?.replace(/"/g, '""') || ""}"`,
          vinyl.purchaseDate ? new Date(vinyl.purchaseDate).toISOString().split('T')[0] : "",
          vinyl.purchasePrice || "",
          `"${vinyl.purchaseCurrency || ""}"`,
          `"${vinyl.purchaseLocation?.replace(/"/g, '""') || ""}"`,
          `"${vinyl.catalogNumber?.replace(/"/g, '""') || ""}"`,
          `"${vinyl.country?.replace(/"/g, '""') || ""}"`,
          vinyl.discogsId || "",
          `"${vinyl.imageUrl || ""}"`,
          `"${vinyl.collection?.title || "Default"}"`,
          `"${vinyl.collection?.type || "collection"}"`,
          new Date(vinyl.createdAt).toISOString().split('T')[0],
        ].join(",");
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vinyl-collection-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export collection" },
      { status: 500 }
    );
  }
}