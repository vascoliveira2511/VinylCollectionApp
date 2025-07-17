import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Discogs username is required' }, { status: 400 })
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN

  if (!DISCOGS_TOKEN) {
    return NextResponse.json({ error: 'Discogs token not configured' }, { status: 500 })
  }

  try {
    const collectionUrl = `https://api.discogs.com/users/${encodeURIComponent(username)}/collection/folders/0/releases?token=${DISCOGS_TOKEN}&per_page=20`
    // console.log('Discogs Collection Stats API: Fetching from URL', collectionUrl) // Commented out for production
    const response = await fetch(collectionUrl, { headers: { 'User-Agent': 'VinylCollectionApp/1.0' } })
    const data = await response.json()
    // console.log('Discogs Collection Stats API: Received data', data) // Commented out for production

    if (response.ok && data.pagination) {
      const totalItems = data.pagination.items
      const releases = data.releases.map((release: any) => ({
        id: release.id,
        artist: release.basic_information.artists.map((a: any) => a.name).join(', '),
        title: release.basic_information.title,
        year: release.basic_information.year,
        imageUrl: release.basic_information.cover_image,
        genre: release.basic_information.genres || [],
      }))
      return NextResponse.json({ totalDiscogsItems: totalItems, discogsReleases: releases })
    } else {
      // console.error('Discogs Collection Stats API: Failed to fetch or parse data', data) // Commented out for production
      return NextResponse.json({ error: 'Failed to fetch Discogs collection summary' }, { status: 404 })
    }
  } catch (error) {
    console.error('Discogs Collection Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Discogs collection summary' }, { status: 500 })
  }
}
