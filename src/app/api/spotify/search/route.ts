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

  try {
    const accessToken = await getSpotifyAccessToken();
    
    // Try multiple search strategies
    let searchQueries = [
      `album:"${album}" artist:"${artist}"`, // Exact match
      `"${album}" "${artist}"`, // Quoted terms
      `${album} ${artist}`, // Simple search
      `artist:${artist} ${album}`, // Artist-focused search
    ];

    let album_data = null;
    let searchResponse = null;

    // Try each search strategy until we find results
    for (const query of searchQueries) {
      console.log(`Trying Spotify search: ${query}`);
      
      searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5&market=US`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`Search results for "${query}":`, searchData.albums?.items?.length || 0, 'albums found');
        
        if (searchData.albums?.items?.length > 0) {
          // Find the best match
          album_data = searchData.albums.items.find(albumItem => {
            const albumName = albumItem.name.toLowerCase();
            const searchAlbum = album.toLowerCase();
            const artistNames = albumItem.artists.map(a => a.name.toLowerCase()).join(' ');
            const searchArtist = artist.toLowerCase();
            
            // Check for exact or close matches
            return (albumName.includes(searchAlbum) || searchAlbum.includes(albumName)) &&
                   (artistNames.includes(searchArtist) || searchArtist.includes(artistNames));
          }) || searchData.albums.items[0]; // Fallback to first result
          
          if (album_data) {
            console.log(`Found album: ${album_data.name} by ${album_data.artists.map(a => a.name).join(', ')}`);
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
      console.error("Failed to get album tracks:", tracksResponse.status, tracksResponse.statusText);
      throw new Error("Failed to get album tracks");
    }

    const tracksData = await tracksResponse.json();
    console.log(`Album "${album_data.name}" has ${tracksData.items?.length || 0} tracks`);
    
    const tracksWithPreviews = tracksData.items?.filter(track => track.preview_url) || [];
    console.log(`${tracksWithPreviews.length} tracks have preview URLs available`);

    // Return album data with tracks
    return NextResponse.json({
      id: album_data.id,
      name: album_data.name,
      images: album_data.images,
      tracks: tracksData,
      external_urls: album_data.external_urls,
    });

  } catch (error) {
    console.error("Spotify API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}