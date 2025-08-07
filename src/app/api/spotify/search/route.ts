import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Token caching
let cachedToken: { token: string; expires: number } | null = null;

// Search results caching (5 minute cache)
const searchCache = new Map<string, { data: any; expires: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getSpotifyAccessToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials not configured");
  }

  // Return cached token if still valid
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();

  // Cache token (expires in 1 hour, we cache for 50 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + 50 * 60 * 1000,
  };

  return data.access_token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");

  if (!artist || !album) {
    return NextResponse.json(
      { error: "Artist and album parameters are required" },
      { status: 400 }
    );
  }

  // Create cache key
  const cacheKey = `${artist.toLowerCase().trim()}:${album
    .toLowerCase()
    .trim()}`;

  // Check cache first
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    console.log(`Cache hit for: ${artist} - ${album}`);
    return NextResponse.json(cached.data);
  }

  try {
    const accessToken = await getSpotifyAccessToken();

    // Enhanced search strategies with better fallbacks
    const cleanArtist = artist.replace(/[\(\)\[\]]/g, "").trim();
    const cleanAlbum = album.replace(/[\(\)\[\]]/g, "").trim();

    let searchQueries = [
      `album:"${cleanAlbum}" artist:"${cleanArtist}"`, // Exact match with clean strings
      `"${cleanAlbum}" "${cleanArtist}"`, // Quoted terms
      `album:"${album}" artist:"${artist}"`, // Original exact match
      `"${album}" "${artist}"`, // Original quoted terms
      `${cleanAlbum} ${cleanArtist}`, // Simple search with clean strings
      `${album} ${artist}`, // Original simple search
      `artist:${cleanArtist} ${cleanAlbum}`, // Artist-focused with clean strings
      `artist:${artist} ${album}`, // Original artist-focused
    ];

    let album_data = null;
    let searchResponse = null;

    // Try each search strategy until we find results
    for (const query of searchQueries) {
      console.log(`Trying Spotify search: ${query}`);

      searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=5&market=US`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(
          `Search results for "${query}":`,
          searchData.albums?.items?.length || 0,
          "albums found"
        );

        if (searchData.albums?.items?.length > 0) {
          // Find the best match
          album_data =
            searchData.albums.items.find((albumItem) => {
              const albumName = albumItem.name.toLowerCase();
              const searchAlbum = album.toLowerCase();
              const artistNames = albumItem.artists
                .map((a) => a.name.toLowerCase())
                .join(" ");
              const searchArtist = artist.toLowerCase();

              // Check for exact or close matches
              return (
                (albumName.includes(searchAlbum) ||
                  searchAlbum.includes(albumName)) &&
                (artistNames.includes(searchArtist) ||
                  searchArtist.includes(artistNames))
              );
            }) || searchData.albums.items[0]; // Fallback to first result

          if (album_data) {
            console.log(
              `Found album: ${album_data.name} by ${album_data.artists
                .map((a) => a.name)
                .join(", ")}`
            );
            break;
          }
        }
      }
    }

    if (!album_data) {
      console.log(`No matching albums found for "${artist} - ${album}"`);
      return NextResponse.json(
        { error: "Album not found on Spotify" },
        { status: 404 }
      );
    }

    // Get album tracks with preview URLs
    console.log(`Getting tracks for album ID: ${album_data.id}`);
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/albums/${album_data.id}/tracks?market=US`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      console.error(
        "Failed to get album tracks:",
        tracksResponse.status,
        tracksResponse.statusText
      );
      throw new Error("Failed to get album tracks");
    }

    const tracksData = await tracksResponse.json();
    console.log(
      `Album "${album_data.name}" has ${tracksData.items?.length || 0} tracks`
    );

    const tracksWithPreviews =
      tracksData.items?.filter((track) => track.preview_url) || [];
    console.log(
      `${tracksWithPreviews.length} tracks have preview URLs available`
    );

    // Prepare response data
    const responseData = {
      id: album_data.id,
      name: album_data.name,
      images: album_data.images,
      tracks: tracksData,
      external_urls: album_data.external_urls,
    };

    // Cache the successful result
    searchCache.set(cacheKey, {
      data: responseData,
      expires: Date.now() + CACHE_DURATION,
    });

    // Clean up old cache entries (simple cleanup)
    if (searchCache.size > 100) {
      const now = Date.now();
      // Use Array.from to avoid downlevelIteration issues
      Array.from(searchCache.entries()).forEach(([key, value]) => {
        if (value.expires < now) {
          searchCache.delete(key);
        }
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Spotify API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
