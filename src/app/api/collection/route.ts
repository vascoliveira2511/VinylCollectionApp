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
  const collectionId = searchParams.get('collectionId')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let whereClause: any = { userId: parseInt(userId) }

  // Filter by collection if specified
  if (collectionId) {
    if (collectionId === 'null' || collectionId === 'undefined') {
      whereClause.collectionId = null
    } else {
      whereClause.collectionId = parseInt(collectionId)
    }
  }

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
    include: {
      collection: {
        select: {
          id: true,
          title: true,
          isDefault: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formattedVinyls = vinyls.map(vinyl => ({
    ...vinyl,
    genre: JSON.parse(vinyl.genres),
    trackList: vinyl.trackList ? JSON.parse(vinyl.trackList) : null
  }))

  return NextResponse.json(formattedVinyls)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const newVinylData = await request.json()
  
  // Ensure genre is an array
  let genres = newVinylData.genre
  if (typeof genres === 'string') {
    genres = genres.split(',').map((g: string) => g.trim()).filter((g: string) => g)
  }

  // Determine the collection ID
  let collectionId = newVinylData.collectionId
  
  // If no collection is specified, find the user's default collection
  if (!collectionId) {
    const defaultCollection = await prisma.collection.findFirst({
      where: {
        userId: parseInt(userId),
        isDefault: true
      }
    })
    
    if (defaultCollection) {
      collectionId = defaultCollection.id
    }
  }

  // Process track list if provided
  let trackList = null
  if (newVinylData.trackList) {
    if (typeof newVinylData.trackList === 'string') {
      trackList = newVinylData.trackList
    } else {
      trackList = JSON.stringify(newVinylData.trackList)
    }
  }

  const newVinyl = await prisma.vinyl.create({
    data: {
      discogsId: newVinylData.discogsId,
      artist: newVinylData.artist,
      title: newVinylData.title,
      year: newVinylData.year,
      imageUrl: newVinylData.imageUrl,
      genres: JSON.stringify(genres),
      // New manual fields
      trackList: trackList,
      description: newVinylData.description || null,
      label: newVinylData.label || null,
      format: newVinylData.format || null,
      condition: newVinylData.condition || null,
      rating: newVinylData.rating ? parseInt(newVinylData.rating) : null,
      purchaseDate: newVinylData.purchaseDate ? new Date(newVinylData.purchaseDate) : null,
      purchasePrice: newVinylData.purchasePrice ? parseFloat(newVinylData.purchasePrice) : null,
      purchaseCurrency: newVinylData.purchaseCurrency || null,
      purchaseLocation: newVinylData.purchaseLocation || null,
      catalogNumber: newVinylData.catalogNumber || null,
      country: newVinylData.country || null,
      userId: parseInt(userId),
      collectionId: collectionId || null
    },
    include: {
      collection: {
        select: {
          id: true,
          title: true,
          isDefault: true
        }
      }
    }
  })

  const vinyls = await prisma.vinyl.findMany({
    where: { userId: parseInt(userId) },
    include: {
      collection: {
        select: {
          id: true,
          title: true,
          isDefault: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formattedVinyls = vinyls.map(vinyl => ({
    ...vinyl,
    genre: JSON.parse(vinyl.genres),
    trackList: vinyl.trackList ? JSON.parse(vinyl.trackList) : null
  }))

  return NextResponse.json(formattedVinyls)
}
