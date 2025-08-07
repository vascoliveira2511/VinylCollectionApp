import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Discogs Master ID is required" },
      { status: 400 }
    );
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

  if (!DISCOGS_TOKEN) {
    return NextResponse.json(
      { error: "Discogs token not configured" },
      { status: 500 }
    );
  }

  try {
    const masterUrl = `https://api.discogs.com/masters/${id}?token=${DISCOGS_TOKEN}`;
    const response = await fetch(masterUrl, {
      headers: { "User-Agent": "VinylCollectionApp/1.0" },
    });
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.message || "Failed to fetch Discogs master data" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Discogs Master API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Discogs master data" },
      { status: 500 }
    );
  }
}