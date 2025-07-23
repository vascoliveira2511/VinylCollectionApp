import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get user's friends and friend requests
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'friends', 'sent', 'received'
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let friends = []

    if (type === 'sent') {
      // Get sent friend requests
      friends = await prisma.friend.findMany({
        where: {
          senderId: parseInt(userId),
          status: 'pending'
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              avatar: true,
              avatarType: true
            }
          }
        }
      })
    } else if (type === 'received') {
      // Get received friend requests
      friends = await prisma.friend.findMany({
        where: {
          receiverId: parseInt(userId),
          status: 'pending'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
              avatarType: true
            }
          }
        }
      })
    } else {
      // Get accepted friends (default)
      friends = await prisma.friend.findMany({
        where: {
          OR: [
            { senderId: parseInt(userId), status: 'accepted' },
            { receiverId: parseInt(userId), status: 'accepted' }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
              avatarType: true
            }
          },
          receiver: {
            select: {
              id: true,
              username: true,
              avatar: true,
              avatarType: true
            }
          }
        }
      })

      // Format friends to show the other user
      friends = friends.map(friend => ({
        ...friend,
        friend: friend.senderId === parseInt(userId) ? friend.receiver : friend.sender
      }))
    }

    return NextResponse.json(friends)
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
  }
}

// POST - Send friend request
export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { receiverId } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

    if (parseInt(userId) === receiverId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: parseInt(userId), receiverId: receiverId },
          { senderId: receiverId, receiverId: parseInt(userId) }
        ]
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 })
    }

    // Create friend request
    const friendRequest = await prisma.friend.create({
      data: {
        senderId: parseInt(userId),
        receiverId: receiverId,
        status: 'pending'
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
            avatarType: true
          }
        }
      }
    })

    return NextResponse.json(friendRequest)
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
  }
}