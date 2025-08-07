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

  console.log(
    "Spotify Client ID:",
    SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.substring(0, 10)}...` : "MISSING"
  );
  console.log(
    "Spotify Client Secret:",
    SPOTIFY_CLIENT_SECRET ? "Present" : "MISSING"
  );

  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && cachedToken.expires > Date.now() + 5 * 60 * 1000) {
    console.log("Using cached Spotify token");
    return cachedToken.token;
  }

  console.log("Fetching new Spotify token");
  const authHeader = `Basic ${Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64")}`;

  console.log("Auth header length:", authHeader.length);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Spotify token request failed:", response.status, errorText);
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();
  console.log("Got new Spotify token, expires in", data.expires_in, "seconds");
  console.log(
    "Token starts with:",
    data.access_token ? data.access_token.substring(0, 20) + "..." : "MISSING"
  );

  // Cache token (expires in 1 hour, we cache for 45 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + 45 * 60 * 1000,
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
    let accessToken = await getSpotifyAccessToken();

    // Enhanced search strategies - try the most common patterns first
    const ampAlbum = album.replace(/\s*&\s*/g, " and ").trim();
    const ampArtist = artist.replace(/\s*&\s*/g, " and ").trim();

    let searchQueries = [
      // Try the most likely patterns first
      `${ampArtist} ${ampAlbum}`, // Simple search with "and"
      `${artist} ${album}`, // Original simple search
      `"${ampAlbum}" "${ampArtist}"`, // Replace & with "and"
      `"${album}" "${artist}"`, // Original quoted terms
      `${ampArtist} "${ampAlbum}"`, // Artist + quoted album with "and"
      `${artist} "${album}"`, // Artist + quoted album
      `album:${ampAlbum} artist:${ampArtist}`, // Spotify fields with "and"
      `album:${album} artist:${artist}`, // Spotify fields original
      ampAlbum, // Just album name with "and"
      album, // Just original album name
    ];

    let album_data: any = null;
    let searchResponse = null;
    let searchData = null;

    // Try each search strategy until we find results
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];

      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        console.log("Waiting 500ms before next search...");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`Trying Spotify search: ${query}`);
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=album&limit=5`;
      console.log(`Search URL: ${searchUrl}`);
      console.log(`Using token: ${accessToken.substring(0, 20)}...`);

      searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (searchResponse.ok) {
        searchData = await searchResponse.json();
        console.log(
          `✓ Search results for "${query}":`,
          searchData.albums?.items?.length || 0,
          "albums found"
        );

        // Debug: Show what we actually got from Spotify
        if (searchData.albums?.items?.length > 0) {
          searchData.albums.items.slice(0, 3).forEach((item, idx) => {
            console.log(
              `  ${idx + 1}. "${item.name}" by ${item.artists
                .map((a) => a.name)
                .join(", ")}`
            );
          });
        }
      } else {
        console.error(
          `✗ Spotify search failed for "${query}":`,
          searchResponse.status,
          searchResponse.statusText
        );
        const errorText = await searchResponse.text();
        console.error(`Response body:`, errorText);

        // If token expired, try to get a fresh token and retry once
        if (searchResponse.status === 401) {
          console.log("Token expired, fetching fresh token and retrying...");
          cachedToken = null; // Clear cached token
          accessToken = await getSpotifyAccessToken();

          // Retry the same query with fresh token
          const retryResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(
              query
            )}&type=album&limit=5`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (retryResponse.ok) {
            searchData = await retryResponse.json();
            searchResponse = retryResponse;
            console.log(
              `✓ Retry successful for "${query}":`,
              searchData.albums?.items?.length || 0,
              "albums found"
            );

            // Show what we got from Spotify
            if (searchData.albums?.items?.length > 0) {
              searchData.albums.items.slice(0, 3).forEach((item, idx) => {
                console.log(
                  `  ${idx + 1}. "${item.name}" by ${item.artists
                    .map((a) => a.name)
                    .join(", ")}`
                );
              });
            }
          } else {
            console.error(
              `✗ Retry also failed for "${query}":`,
              retryResponse.status,
              retryResponse.statusText
            );
            continue; // Skip to next query
          }
        } else {
          continue; // Skip to next query for non-401 errors
        }
      }

      if (searchData && searchData.albums?.items?.length > 0) {
        // Very flexible matching - normalize text by removing special chars and extra spaces
        const normalizeText = (text: string) =>
          text
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const searchAlbumNorm = normalizeText(album);
        const searchAlbumAmpNorm = normalizeText(ampAlbum);
        const searchArtistNorm = normalizeText(artist);
        const searchArtistAmpNorm = normalizeText(ampArtist);

        // Try exact match first
        album_data = searchData.albums.items.find((albumItem: any) => {
          const albumNameNorm = normalizeText(albumItem.name);
          const artistNamesNorm = albumItem.artists
            .map((a: any) => normalizeText(a.name))
            .join(" ");

          // Core album names must match (ignoring edition info)
          const coreAlbumMatch =
            albumNameNorm === searchAlbumNorm ||
            albumNameNorm === searchAlbumAmpNorm ||
            albumNameNorm.startsWith(searchAlbumNorm) ||
            albumNameNorm.startsWith(searchAlbumAmpNorm);

          const artistMatch =
            artistNamesNorm.includes(searchArtistNorm) ||
            artistNamesNorm.includes(searchArtistAmpNorm);

          return coreAlbumMatch && artistMatch;
        });

        // If no exact match, try partial match
        if (!album_data) {
          album_data = searchData.albums.items.find((albumItem: any) => {
            const albumNameNorm = normalizeText(albumItem.name);
            const artistNamesNorm = albumItem.artists
              .map((a: any) => normalizeText(a.name))
              .join(" ");

            // Core album title must be present
            const albumWords = searchAlbumNorm
              .split(" ")
              .filter((w: string) => w.length > 2);
            const albumWordsAmp = searchAlbumAmpNorm
              .split(" ")
              .filter((w: string) => w.length > 2);

            const albumMatch =
              albumWords.every((word: string) =>
                albumNameNorm.includes(word)
              ) ||
              albumWordsAmp.every((word: string) =>
                albumNameNorm.includes(word)
              );

            const artistMatch =
              artistNamesNorm.includes(searchArtistNorm) ||
              artistNamesNorm.includes(searchArtistAmpNorm);

            return albumMatch && artistMatch;
          });
        }

        // Final fallback - just take first result if it's somewhat related
        if (!album_data && searchData.albums.items.length > 0) {
          const firstAlbum = searchData.albums.items[0];
          const firstAlbumNorm = normalizeText(firstAlbum.name);
          const firstArtistNorm = firstAlbum.artists
            .map((a: any) => normalizeText(a.name))
            .join(" ");

          // Only take first result if artist matches
          if (
            firstArtistNorm.includes(searchArtistNorm) ||
            firstArtistNorm.includes(searchArtistAmpNorm)
          ) {
            album_data = firstAlbum;
            console.log(`Taking first result as fallback: ${firstAlbum.name}`);
          }
        }

        if (album_data) {
          console.log(
            `✓ Matched album: "${album_data.name}" by ${album_data.artists
              .map((a: any) => a.name)
              .join(", ")}`
          );
          break;
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
