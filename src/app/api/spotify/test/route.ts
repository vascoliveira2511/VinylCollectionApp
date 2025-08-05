import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials not configured");
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
  return data.access_token;
}

export async function GET() {
  try {
    const accessToken = await getSpotifyAccessToken();
    
    // Test with a famous album that should have previews
    const testCases = [
      { artist: "The Beatles", album: "Abbey Road" },
      { artist: "Pink Floyd", album: "The Dark Side of the Moon" },
      { artist: "Daft Punk", album: "Random Access Memories" },
    ];

    const results = [];

    for (const { artist, album } of testCases) {
      console.log(`\n=== Testing: ${artist} - ${album} ===`);
      
      const searchQuery = `album:"${album}" artist:"${artist}"`;
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=album&limit=3&market=US`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const albumData = searchData.albums?.items?.[0];
        
        if (albumData) {
          // Get tracks
          const tracksResponse = await fetch(
            `https://api.spotify.com/v1/albums/${albumData.id}/tracks?market=US`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            const tracksWithPreviews = tracksData.items?.filter(track => track.preview_url) || [];
            
            results.push({
              search: `${artist} - ${album}`,
              found: `${albumData.name} by ${albumData.artists.map(a => a.name).join(', ')}`,
              totalTracks: tracksData.items?.length || 0,
              previewTracks: tracksWithPreviews.length,
              samplePreviewUrls: tracksWithPreviews.slice(0, 2).map(t => ({ name: t.name, preview_url: t.preview_url })),
              albumUrl: albumData.external_urls?.spotify,
            });
          }
        } else {
          results.push({
            search: `${artist} - ${album}`,
            found: "No albums found",
          });
        }
      }
    }

    return NextResponse.json({
      message: "Spotify API Test Results",
      credentials: {
        clientId: SPOTIFY_CLIENT_ID ? "✓ Set" : "✗ Missing",
        clientSecret: SPOTIFY_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
      },
      testResults: results,
    });

  } catch (error) {
    console.error("Spotify test error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}