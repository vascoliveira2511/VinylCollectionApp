import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vinyl = await prisma.vinyl.findFirst({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId)
    }
  })

  if (!vinyl) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }

  const formattedVinyl = {
    ...vinyl,
    genre: JSON.parse(vinyl.genres),
    trackList: vinyl.trackList ? JSON.parse(vinyl.trackList) : null
  }

  return NextResponse.json(formattedVinyl)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updatedData = await request.json()
  
  // Ensure genre is an array
  let genres = updatedData.genre
  if (typeof genres === 'string') {
    genres = genres.split(',').map((g: string) => g.trim()).filter((g: string) => g)
  }

  // Process track list if provided
  let trackList = null
  if (updatedData.trackList) {
    if (typeof updatedData.trackList === 'string') {
      trackList = updatedData.trackList
    } else {
      trackList = JSON.stringify(updatedData.trackList)
    }
  }

  const updatedVinyl = await prisma.vinyl.updateMany({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId)
    },
    data: {
      discogsId: updatedData.discogsId,
      artist: updatedData.artist,
      title: updatedData.title,
      year: updatedData.year,
      imageUrl: updatedData.imageUrl,
      genres: JSON.stringify(genres),
      collectionId: updatedData.collectionId || null,
      // New manual fields
      trackList: trackList,
      description: updatedData.description || null,
      label: updatedData.label || null,
      format: updatedData.format || null,
      condition: updatedData.condition || null,
      rating: updatedData.rating ? parseInt(updatedData.rating) : null,
      purchaseDate: updatedData.purchaseDate ? new Date(updatedData.purchaseDate) : null,
      purchasePrice: updatedData.purchasePrice ? parseFloat(updatedData.purchasePrice) : null,
      purchaseLocation: updatedData.purchaseLocation || null,
      catalogNumber: updatedData.catalogNumber || null,
      country: updatedData.country || null
    }
  })

  if (updatedVinyl.count === 0) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }

  const vinyl = await prisma.vinyl.findFirst({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId)
    }
  })

  const formattedVinyl = {
    ...vinyl,
    genre: JSON.parse(vinyl!.genres),
    trackList: vinyl!.trackList ? JSON.parse(vinyl!.trackList) : null
  }

  return NextResponse.json(formattedVinyl)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deletedVinyl = await prisma.vinyl.deleteMany({
    where: {
      id: parseInt(params.id),
      userId: parseInt(userId)
    }
  })

  if (deletedVinyl.count === 0) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Vinyl deleted successfully' })
}

