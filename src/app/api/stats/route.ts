import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/db";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user vinyls with detailed information
    const vinyls = await db.vinyl.findMany({
      where: { userId: user.id },
      include: {
        collection: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate comprehensive statistics
    const genreStats: Record<string, number> = {};
    const decadeStats: Record<string, number> = {};
    const artistStats: Record<string, number> = {};
    const conditionStats: Record<string, number> = {};
    const collectionGrowth: Array<{ date: string; count: number }> = [];

    let totalValue = 0;
    let totalRating = 0;
    let ratedRecords = 0;

    // Process each vinyl record
    vinyls.forEach((vinyl) => {
      // Parse genres from JSON string
      let genres: string[] = [];
      try {
        genres = typeof vinyl.genres === 'string' ? JSON.parse(vinyl.genres) : vinyl.genres || [];
      } catch {
        genres = [];
      }

      // Genre statistics
      genres.forEach((genre: string) => {
        if (genre) {
          genreStats[genre] = (genreStats[genre] || 0) + 1;
        }
      });

      // Decade statistics
      if (vinyl.year) {
        const decade = `${Math.floor(vinyl.year / 10) * 10}s`;
        decadeStats[decade] = (decadeStats[decade] || 0) + 1;
      }

      // Artist statistics
      if (vinyl.artist) {
        artistStats[vinyl.artist] = (artistStats[vinyl.artist] || 0) + 1;
      }

      // Condition statistics
      if (vinyl.condition) {
        conditionStats[vinyl.condition] = (conditionStats[vinyl.condition] || 0) + 1;
      }

      // Value calculation
      if (vinyl.purchasePrice) {
        totalValue += vinyl.purchasePrice;
      }

      // Rating calculation
      if (vinyl.rating) {
        totalRating += vinyl.rating;
        ratedRecords++;
      }
    });

    // Generate collection growth timeline
    const monthlyGrowth = new Map<string, number>();
    let currentCount = 0;

    vinyls.forEach((vinyl) => {
      currentCount++;
      const date = new Date(vinyl.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowth.set(monthKey, currentCount);
    });

    monthlyGrowth.forEach((count, date) => {
      collectionGrowth.push({ date, count });
    });

    // Get top valued records
    const topValuedRecords = vinyls
      .filter((vinyl) => vinyl.purchasePrice && vinyl.purchasePrice > 0)
      .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
      .slice(0, 10)
      .map((vinyl) => ({
        id: vinyl.id,
        artist: vinyl.artist,
        title: vinyl.title,
        purchasePrice: vinyl.purchasePrice || 0,
        purchaseCurrency: vinyl.purchaseCurrency || "USD",
        imageUrl: vinyl.imageUrl,
      }));

    // Prepare response data
    const statsData = {
      totalRecords: vinyls.length,
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
      averageRating: ratedRecords > 0 ? Math.round((totalRating / ratedRecords) * 10) / 10 : 0,
      genreStats,
      decadeStats,
      artistStats,
      conditionStats,
      collectionGrowth,
      topValuedRecords,
      additionalStats: {
        uniqueArtists: Object.keys(artistStats).length,
        uniqueGenres: Object.keys(genreStats).length,
        ratedRecords,
        recordsWithPrice: vinyls.filter(v => v.purchasePrice && v.purchasePrice > 0).length,
        oldestRecord: vinyls.reduce((oldest, vinyl) => 
          !oldest || (vinyl.year && vinyl.year < (oldest.year || Infinity)) ? vinyl : oldest
        , vinyls[0]),
        newestRecord: vinyls.reduce((newest, vinyl) => 
          !newest || (vinyl.year && vinyl.year > (newest.year || 0)) ? vinyl : newest
        , vinyls[0]),
      }
    };

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}