import { NextResponse } from "next/server";

const DISCOGS_API_BASE = "https://api.discogs.com";

interface SearchFilters {
  query?: string;
  artist?: string;
  title?: string;
  label?: string;
  genre?: string;
  style?: string;
  country?: string;
  year?: string;
  format?: string;
  type?: "release" | "master" | "artist" | "label";
  sort?: "title" | "artist" | "year" | "country" | "format";
  sort_order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export async function POST(request: Request) {
  try {
    const filters: SearchFilters = await request.json();

    // Build search query
    const searchTerms = [];
    if (filters.query) {
      // Use wildcard searches for better partial matching
      const queryParts = filters.query
        .split(" ")
        .filter((part) => part.length > 0);
      const wildcardQuery = queryParts.map((part) => `*${part}*`).join(" AND ");
      searchTerms.push(wildcardQuery);
    }
    if (filters.artist) searchTerms.push(`artist:"${filters.artist}"`);
    if (filters.title) searchTerms.push(`title:"${filters.title}"`);
    if (filters.label) searchTerms.push(`label:"${filters.label}"`);
    if (filters.genre) searchTerms.push(`genre:"${filters.genre}"`);
    if (filters.style) searchTerms.push(`style:"${filters.style}"`);
    if (filters.country) searchTerms.push(`country:"${filters.country}"`);
    if (filters.year) searchTerms.push(`year:${filters.year}`);
    if (filters.format) searchTerms.push(`format:"${filters.format}"`);

    if (searchTerms.length === 0) {
      return NextResponse.json(
        { error: "No search terms provided" },
        { status: 400 }
      );
    }

    const query = searchTerms.join(" AND ");

    // Build API URL
    const searchParams = new URLSearchParams({
      q: query,
      type: filters.type || "release",
      per_page: (filters.per_page || 50).toString(),
      page: (filters.page || 1).toString(),
    });

    if (filters.sort) {
      searchParams.append("sort", filters.sort);
    }
    if (filters.sort_order) {
      searchParams.append("sort_order", filters.sort_order);
    }

    const url = `${DISCOGS_API_BASE}/database/search?${searchParams.toString()}`;

    // Make request to Discogs API
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VinylCollectionApp/1.0 +https://your-app.com",
        Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the results to match our interface
    const transformedResults =
      data.results?.map((item: any) => {
        // Extract artist from title (Discogs format is usually "Artist - Title")
        let artist = "Unknown Artist";
        let title = item.title || "Unknown Title";

        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        } else if (item.artist) {
          artist = item.artist;
        }

        // Use the best available image - prefer cover_image over thumb
        let imageUrl = item.cover_image || item.thumb;

        return {
          id: item.id?.toString(),
          title: title,
          artist: artist,
          year: item.year,
          format: item.format || [],
          genre: item.genre || [],
          style: item.style || [],
          label: item.label || [],
          country: item.country,
          thumb: imageUrl,
          uri: item.uri,
          type: item.type,
          catno: item.catno,
          // Additional fields now included
          barcode: item.barcode || [],
          master_id: item.master_id,
          master_url: item.master_url,
          resource_url: item.resource_url,
          community: item.community || null,
        };
      }) || [];

    return NextResponse.json({
      results: transformedResults,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error("Discogs search error:", error);
    return NextResponse.json(
      { error: "Failed to search Discogs database" },
      { status: 500 }
    );
  }
}
