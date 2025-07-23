import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get user's favorite vinyls
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const favorites = await prisma.favoriteVinyl.findMany({
      where: { userId: parseInt(userId) },
      include: {
        vinyl: {
          include: {
            collection: {
              select: {
                id: true,
                title: true,
                isDefault: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the response
    const formattedFavorites = favorites.map(fav => ({
      ...fav.vinyl,
      genre: JSON.parse(fav.vinyl.genres),
      trackList: fav.vinyl.trackList ? JSON.parse(fav.vinyl.trackList) : null,
      favoritedAt: fav.createdAt
    }))

    return NextResponse.json(formattedFavorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST - Add vinyl to favorites
export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { vinylId } = await request.json()

    if (!vinylId) {
      return NextResponse.json({ error: 'Vinyl ID is required' }, { status: 400 })
    }

    // Check if vinyl exists
    const vinyl = await prisma.vinyl.findUnique({
      where: { id: vinylId }
    })

    if (!vinyl) {
      return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteVinyl.findUnique({
      where: {
        userId_vinylId: {
          userId: parseInt(userId),
          vinylId: vinylId
        }
      }
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Vinyl already in favorites' }, { status: 400 })
    }

    // Add to favorites
    const favorite = await prisma.favoriteVinyl.create({
      data: {
        userId: parseInt(userId),
        vinylId: vinylId
      },
      include: {
        vinyl: true
      }
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 })
  }
}