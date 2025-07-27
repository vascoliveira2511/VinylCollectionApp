import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const logFilePath = path.join(process.cwd(), "data", "discogs_api_debug.log");

async function appendLog(message: string) {
  // await fs.appendFile(logFilePath, message + '\n') // Commented out for production
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

  if (!DISCOGS_TOKEN) {
    return NextResponse.json(
      { error: "Discogs token not configured" },
      { status: 500 }
    );
  }

  try {
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(
      query
    )}&type=release&token=${DISCOGS_TOKEN}`;
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "VinylCollectionApp/1.0" },
    });
    const data = await response.json();

    // await appendLog(`\n--- Discogs Suggest API Response for query: ${query} ---\n`) // Commented out for production
    // await appendLog(JSON.stringify(data.results, null, 2)) // Commented out for production

    if (data.results && data.results.length > 0) {
      const uniqueSuggestions = new Map<
        string,
        {
          id: string;
          artist: string;
          title: string;
          isMaster: boolean;
          genre: string[];
          style: string[];
          year: number | null;
          format: string[];
          label: string[];
          thumb: string | null;
          country: string | null;
          catno: string | null;
        }
      >();

      data.results.forEach((result: any) => {
        let artistName = result.artist;
        let trackTitle = result.title;

        if (!artistName && trackTitle.includes(" - ")) {
          const parts = trackTitle.split(" - ");
          artistName = parts[0].trim();
          trackTitle = parts.slice(1).join(" - ").trim();
        }

        // Use the best available image - prefer cover_image over thumb
        let imageUrl = result.cover_image || result.thumb;

        const key = `${artistName || "Unknown Artist"} - ${trackTitle}`;
        if (
          !uniqueSuggestions.has(key) ||
          (result.type === "master" && !uniqueSuggestions.get(key)?.isMaster)
        ) {
          uniqueSuggestions.set(key, {
            id: result.id?.toString() || "",
            artist: artistName || "Unknown Artist",
            title: trackTitle,
            isMaster: result.type === "master",
            genre: result.genre || [],
            style: result.style || [],
            year: result.year || null,
            format: result.format || [],
            label: result.label || [],
            thumb: imageUrl,
            country: result.country || null,
            catno: result.catno || null,
          });
        }
      });

      const sortedSuggestions = Array.from(uniqueSuggestions.values())
        .sort((a, b) => {
          if (a.isMaster && !b.isMaster) return -1;
          if (!a.isMaster && b.isMaster) return 1;
          return a.title.localeCompare(b.title);
        })
        .slice(0, 8); // Limit to 8 suggestions for better display

      return NextResponse.json(sortedSuggestions);
    } else {
      // await appendLog(`\nDiscogs Suggest API: No suggestions found for query: ${query}\n`) // Commented out for production
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Discogs Suggest API error:", error);
    // await appendLog(`\n--- Discogs Suggest API Error for query: ${query} ---\n`) // Commented out for production
    // await appendLog(error instanceof Error ? error.message : String(error)) // Commented out for production
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
