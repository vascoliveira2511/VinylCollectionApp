import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(userId)
      },
      include: {
        vinyls: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { vinyls: true }
        }
      }
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Format vinyls to include parsed genres
    const formattedVinyls = collection.vinyls.map(vinyl => ({
      ...vinyl,
      genre: JSON.parse(vinyl.genres)
    }))

    return NextResponse.json({
      ...collection,
      vinyls: formattedVinyls
    })
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description, imageUrl, color, isPublic } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Collection title is required' }, { status: 400 })
    }

    const collection = await prisma.collection.updateMany({
      where: {
        id: parseInt(params.id),
        userId: parseInt(userId)
      },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        color: color || null,
        isPublic: isPublic || false
      }
    })

    if (collection.count === 0) {
      return NextResponse.json({ error: 'Collection not found or cannot be modified' }, { status: 404 })
    }

    const updatedCollection = await prisma.collection.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(userId)
      },
      include: {
        _count: {
          select: { vinyls: true }
        }
      }
    })

    return NextResponse.json(updatedCollection)
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(userId)
      }
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    if (collection.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default collection' }, { status: 400 })
    }

    // Move vinyls back to default collection or unassign them
    const defaultCollection = await prisma.collection.findFirst({
      where: {
        userId: parseInt(userId),
        isDefault: true
      }
    })

    if (defaultCollection) {
      await prisma.vinyl.updateMany({
        where: { collectionId: parseInt(params.id) },
        data: { collectionId: defaultCollection.id }
      })
    } else {
      await prisma.vinyl.updateMany({
        where: { collectionId: parseInt(params.id) },
        data: { collectionId: null }
      })
    }

    await prisma.collection.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}