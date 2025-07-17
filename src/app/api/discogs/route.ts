import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const logFilePath = path.join(process.cwd(), 'data', 'discogs_api_debug.log')

async function appendLog(message: string) {
  // await fs.appendFile(logFilePath, message + '\n')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const title = searchParams.get('title')

  if (!artist || !title) {
    return NextResponse.json({ error: 'Artist and title are required' }, { status: 400 })
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN

  if (!DISCOGS_TOKEN) {
    return NextResponse.json({ error: 'Discogs token not configured' }, { status: 500 })
  }

  try {
    const searchUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(artist)}&release_title=${encodeURIComponent(title)}&type=release&token=${DISCOGS_TOKEN}`
    const response = await fetch(searchUrl, { headers: { 'User-Agent': 'VinylCollectionApp/1.0' } })
    const data = await response.json()

    await appendLog(`\n--- Discogs API Response for artist: ${artist}, title: ${title} ---\n`)
    await appendLog(JSON.stringify(data.results, null, 2))

    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0]
      let artistName = firstResult.artist;
      let trackTitle = firstResult.title;

      if (!artistName && trackTitle.includes(' - ')) {
        const parts = trackTitle.split(' - ');
        artistName = parts[0].trim();
        trackTitle = parts.slice(1).join(' - ').trim();
      }

      return NextResponse.json({
        title: trackTitle,
        artist: artistName || 'Unknown Artist',
        year: firstResult.year,
        imageUrl: firstResult.cover_image,
        genre: firstResult.genre || [],
        style: firstResult.style || [],
      })
    } else {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Discogs API error:', error)
    await appendLog(`\n--- Discogs API Error for artist: ${artist}, title: ${title} ---\n`)
    await appendLog(error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to fetch album data' }, { status: 500 })
  }
}
