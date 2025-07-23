import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - Accept or decline friend request
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action } = await request.json() // 'accept' or 'decline'
    const friendRequestId = parseInt(params.id)

    // Find the friend request
    const friendRequest = await prisma.friend.findUnique({
      where: { id: friendRequestId }
    })

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Check if user is the receiver of this request
    if (friendRequest.receiverId !== parseInt(userId)) {
      return NextResponse.json({ error: 'Unauthorized to modify this request' }, { status: 403 })
    }

    if (action === 'accept') {
      // Update status to accepted
      const updatedRequest = await prisma.friend.update({
        where: { id: friendRequestId },
        data: { status: 'accepted' },
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
      return NextResponse.json(updatedRequest)
    } else if (action === 'decline') {
      // Delete the friend request
      await prisma.friend.delete({
        where: { id: friendRequestId }
      })
      return NextResponse.json({ message: 'Friend request declined' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating friend request:', error)
    return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 })
  }
}

// DELETE - Remove friend or cancel friend request
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const friendRequestId = parseInt(params.id)

    // Find the friend request/relationship
    const friendRequest = await prisma.friend.findUnique({
      where: { id: friendRequestId }
    })

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend relationship not found' }, { status: 404 })
    }

    // Check if user is involved in this relationship
    if (friendRequest.senderId !== parseInt(userId) && friendRequest.receiverId !== parseInt(userId)) {
      return NextResponse.json({ error: 'Unauthorized to modify this relationship' }, { status: 403 })
    }

    // Delete the relationship
    await prisma.friend.delete({
      where: { id: friendRequestId }
    })

    return NextResponse.json({ message: 'Friend relationship removed' })
  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 })
  }
}