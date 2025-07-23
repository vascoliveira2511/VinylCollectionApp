import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get a user's public collections (for friends)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUserId = request.headers.get('x-user-id')
  const targetUserId = parseInt(params.id)
  
  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if users are friends or if it's the same user
    if (parseInt(currentUserId) !== targetUserId) {
      const friendship = await prisma.friend.findFirst({
        where: {
          OR: [
            { senderId: parseInt(currentUserId), receiverId: targetUserId, status: 'accepted' },
            { receiverId: parseInt(currentUserId), senderId: targetUserId, status: 'accepted' }
          ]
        }
      })

      if (!friendship) {
        return NextResponse.json({ error: 'Not authorized to view this user\'s collections' }, { status: 403 })
      }
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        avatar: true,
        avatarType: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get public collections or all collections if it's the same user
    const collections = await prisma.collection.findMany({
      where: {
        userId: targetUserId,
        ...(parseInt(currentUserId) !== targetUserId ? { isPublic: true } : {})
      },
      include: {
        _count: {
          select: { vinyls: true }
        },
        vinyls: {
          take: 3, // Get first 3 vinyls for preview
          select: {
            id: true,
            imageUrl: true,
            artist: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      user,
      collections
    })
  } catch (error) {
    console.error('Error fetching user collections:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}