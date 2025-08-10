import { NextResponse } from "next/server";

// Simple in-memory cache for recommendations (lasts for the lifetime of the server process)
const recommendationsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedData(key: string) {
  const cached = recommendationsCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    recommendationsCache.delete(key);
  }
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL) {
  recommendationsCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discogsId = searchParams.get('discogsId');
  
  if (!discogsId) {
    return NextResponse.json(
      { error: "discogsId is required" },
      { status: 400 }
    );
  }

  // Check cache first
  const cacheKey = `recommendations:${discogsId}`;
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

  if (!DISCOGS_TOKEN) {
    return NextResponse.json(
      { error: "Discogs token not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the vinyl release data first
    const releaseUrl = `https://api.discogs.com/releases/${discogsId}?token=${DISCOGS_TOKEN}`;
    const releaseResponse = await fetch(releaseUrl, {
      headers: { "User-Agent": "VinylCollectionApp/1.0" },
    });
    
    if (!releaseResponse.ok) {
      return NextResponse.json(
        { error: "Could not fetch release data for recommendations" },
        { status: 404 }
      );
    }
    
    const releaseData = await releaseResponse.json();

    if (!releaseData) {
      return NextResponse.json(
        { error: "Could not fetch release data for recommendations" },
        { status: 404 }
      );
    }

    // Build search terms for recommendations
    const artist = releaseData.artists?.[0]?.name || "";
    const genres = releaseData.genres || [];
    const styles = releaseData.styles || [];
    
    // Search strategies for recommendations
    const recommendations = [];
    
    // Strategy 1: Same artist, different releases (vinyl only)
    if (artist) {
      try {
        // Search for releases only (no masters)
        const artistReleaseUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artist)}&type=release&format=vinyl&per_page=10&token=${DISCOGS_TOKEN}`;
        const releaseResponse = await fetch(artistReleaseUrl, {
          headers: { "User-Agent": "VinylCollectionApp/1.0" },
        });
        
        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json();
          const filteredReleases = releaseData.results
            ?.filter((r: any) => r.id !== parseInt(discogsId || '0'))
            ?.slice(0, 6) || [];
          recommendations.push(...filteredReleases);
        }
      } catch (err) {
        console.log("Artist search failed:", err);
      }
    }
    
    // Strategy 2: Same genre/style (vinyl releases only)
    if (genres.length > 0 || styles.length > 0) {
      try {
        const genreStyle = [...genres, ...styles].slice(0, 2).join(' OR ');
        
        // Search vinyl releases only
        const genreReleaseUrl = `https://api.discogs.com/database/search?genre=${encodeURIComponent(genreStyle)}&type=release&format=vinyl&per_page=10&sort=have,desc&token=${DISCOGS_TOKEN}`;
        const releaseResponse = await fetch(genreReleaseUrl, {
          headers: { "User-Agent": "VinylCollectionApp/1.0" },
        });
        
        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json();
          const filteredReleases = releaseData.results
            ?.filter((r: any) => 
              r.id !== parseInt(discogsId || '0') && 
              !recommendations.find((existing: any) => existing.id === r.id)
            )
            ?.slice(0, 6) || [];
          recommendations.push(...filteredReleases);
        }
      } catch (err) {
        console.log("Genre search failed:", err);
      }
    }
    
    // Strategy 3: Popular vinyl releases from same year
    if (releaseData.year) {
      try {
        // Search vinyl releases from same year only
        const yearReleaseUrl = `https://api.discogs.com/database/search?year=${releaseData.year}&type=release&format=vinyl&per_page=8&sort=have,desc&token=${DISCOGS_TOKEN}`;
        const releaseResponse = await fetch(yearReleaseUrl, {
          headers: { "User-Agent": "VinylCollectionApp/1.0" },
        });
        
        if (releaseResponse.ok) {
          const yearData = await releaseResponse.json();
          const filteredReleases = yearData.results
            ?.filter((r: any) => 
              r.id !== parseInt(discogsId || '0') && 
              !recommendations.find((existing: any) => existing.id === r.id)
            )
            ?.slice(0, 4) || [];
          recommendations.push(...filteredReleases);
        }
      } catch (err) {
        console.log("Year search failed:", err);
      }
    }

    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations
      .filter((rec, index, arr) => arr.findIndex(r => r.id === rec.id) === index)
      .slice(0, 12); // Show up to 12 vinyl recommendations

    // For better performance, only fetch details for high-priority recommendations
    // Prioritize artist matches and genre matches over year matches
    const prioritizedRecs = uniqueRecommendations.sort((a, b) => {
      if (a.artist?.toLowerCase().includes(artist.toLowerCase()) && !b.artist?.toLowerCase().includes(artist.toLowerCase())) return -1;
      if (b.artist?.toLowerCase().includes(artist.toLowerCase()) && !a.artist?.toLowerCase().includes(artist.toLowerCase())) return 1;
      return 0;
    });

    // Only fetch detailed info for top 12 vinyl recommendations to reduce API calls
    const detailedRecommendations = await Promise.allSettled(
      prioritizedRecs.slice(0, 12).map(async (rec: any) => {
        try {
          // Always fetch as vinyl release (no masters)
          const detailUrl = `https://api.discogs.com/releases/${rec.id}?token=${DISCOGS_TOKEN}`;
          
          const detailResponse = await fetch(detailUrl, {
            headers: { "User-Agent": "VinylCollectionApp/1.0" },
          });

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            return {
              id: rec.id,
              title: detailData.title,
              artist: Array.isArray(detailData.artists) 
                ? detailData.artists.map((a: any) => a.name).join(", ") 
                : (rec.artist || "Unknown Artist"),
              year: detailData.year || rec.year,
              genre: detailData.genres || (Array.isArray(rec.genre) ? rec.genre : (rec.genre ? [rec.genre] : [])),
              style: detailData.styles || (Array.isArray(rec.style) ? rec.style : (rec.style ? [rec.style] : [])),
              // Use high-quality image from detailed data
              imageUrl: detailData.images?.[0]?.uri500 || detailData.images?.[0]?.uri || rec.thumb || rec.cover_image,
              thumb: rec.thumb, // Keep original thumb as fallback
              type: 'release',
              country: detailData.country,
              format: detailData.formats?.[0]?.name,
              label: detailData.labels?.[0]?.name
            };
          } else {
            // Fallback to search result data if detailed fetch fails
            return {
              id: rec.id,
              title: rec.title,
              artist: rec.artist || (Array.isArray(rec.artists) ? rec.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"),
              year: rec.year,
              genre: Array.isArray(rec.genre) ? rec.genre : (rec.genre ? [rec.genre] : []),
              style: Array.isArray(rec.style) ? rec.style : (rec.style ? [rec.style] : []),
              imageUrl: rec.thumb || rec.cover_image,
              thumb: rec.thumb || rec.cover_image,
              type: 'release'
            };
          }
        } catch (err) {
          // Fallback to search result data on error
          console.log(`Failed to fetch details for ${rec.id}:`, err);
          return {
            id: rec.id,
            title: rec.title,
            artist: rec.artist || (Array.isArray(rec.artists) ? rec.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"),
            year: rec.year,
            genre: Array.isArray(rec.genre) ? rec.genre : (rec.genre ? [rec.genre] : []),
            style: Array.isArray(rec.style) ? rec.style : (rec.style ? [rec.style] : []),
            imageUrl: rec.thumb || rec.cover_image,
            thumb: rec.thumb || rec.cover_image,
            type: 'release'
          };
        }
      })
    );

    // Filter out failed requests and extract successful results
    const successfulRecommendations = detailedRecommendations
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const result = {
      recommendations: successfulRecommendations,
      total: successfulRecommendations.length
    };

    // Cache the result
    setCachedData(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}