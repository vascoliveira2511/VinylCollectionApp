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
    const profileUrl = `https://api.discogs.com/users/${encodeURIComponent(username)}?token=${DISCOGS_TOKEN}`
    const response = await fetch(profileUrl, { headers: { 'User-Agent': 'VinylCollectionApp/1.0' } })
    const data = await response.json()

    if (response.ok && data.avatar_url) {
      return NextResponse.json({ avatarUrl: data.avatar_url })
    } else {
      return NextResponse.json({ error: 'Discogs user not found or no avatar' }, { status: 404 })
    }
  } catch (error) {
    console.error('Discogs API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Discogs profile' }, { status: 500 })
  }
}
