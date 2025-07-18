import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const artist = searchParams.get('artist')
  const title = searchParams.get('title')
  const genre = searchParams.get('genre')
  const year = searchParams.get('year')
  const yearFrom = searchParams.get('yearFrom')
  const yearTo = searchParams.get('yearTo')
  
  console.log('API Collection GET: userId', userId)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let whereClause: any = { userId: parseInt(userId) }

  // Global search across artist, title, and genres
  if (search) {
    whereClause.OR = [
      { artist: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { genres: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Specific field filters
  if (artist) {
    whereClause.artist = { contains: artist, mode: 'insensitive' }
  }
  if (title) {
    whereClause.title = { contains: title, mode: 'insensitive' }
  }
  if (genre) {
    whereClause.genres = { contains: genre, mode: 'insensitive' }
  }
  if (year) {
    whereClause.year = parseInt(year)
  }
  if (yearFrom || yearTo) {
    whereClause.year = {}
    if (yearFrom) whereClause.year.gte = parseInt(yearFrom)
    if (yearTo) whereClause.year.lte = parseInt(yearTo)
  }

  const vinyls = await prisma.vinyl.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  const formattedVinyls = vinyls.map(vinyl => ({
    ...vinyl,
    genre: JSON.parse(vinyl.genres)
  }))

  return NextResponse.json(formattedVinyls)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  console.log('API Collection POST: userId', userId)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const newVinylData = await request.json()
  
  // Ensure genre is an array
  let genres = newVinylData.genre
  if (typeof genres === 'string') {
    genres = genres.split(',').map((g: string) => g.trim()).filter((g: string) => g)
  }

  const newVinyl = await prisma.vinyl.create({
    data: {
      discogsId: newVinylData.discogsId,
      artist: newVinylData.artist,
      title: newVinylData.title,
      year: newVinylData.year,
      imageUrl: newVinylData.imageUrl,
      genres: JSON.stringify(genres),
      userId: parseInt(userId)
    }
  })

  const vinyls = await prisma.vinyl.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: 'desc' }
  })

  const formattedVinyls = vinyls.map(vinyl => ({
    ...vinyl,
    genre: JSON.parse(vinyl.genres)
  }))

  return NextResponse.json(formattedVinyls)
}
