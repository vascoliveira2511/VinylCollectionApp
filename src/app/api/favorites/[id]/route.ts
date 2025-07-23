import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// DELETE - Remove vinyl from favorites
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const vinylId = parseInt(params.id)

    // Find and delete the favorite
    const favorite = await prisma.favoriteVinyl.findUnique({
      where: {
        userId_vinylId: {
          userId: parseInt(userId),
          vinylId: vinylId
        }
      }
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    await prisma.favoriteVinyl.delete({
      where: {
        userId_vinylId: {
          userId: parseInt(userId),
          vinylId: vinylId
        }
      }
    })

    return NextResponse.json({ message: 'Removed from favorites' })
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return NextResponse.json({ error: 'Failed to remove from favorites' }, { status: 500 })
  }
}