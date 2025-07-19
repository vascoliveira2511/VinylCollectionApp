import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const collections = await prisma.collection.findMany({
      where: { userId: parseInt(userId) },
      include: {
        vinyls: true,
        _count: {
          select: { vinyls: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Collection title is required' }, { status: 400 })
    }

    const collection = await prisma.collection.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: parseInt(userId),
        isDefault: false
      },
      include: {
        _count: {
          select: { vinyls: true }
        }
      }
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}