import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import * as jose from 'jose'
import { prisma } from '@/lib/db'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    userId = payload.userId as string
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { avatar, avatarType } = await request.json()
    
    if (!avatar || !avatarType) {
      return NextResponse.json({ error: 'Avatar and avatarType are required' }, { status: 400 })
    }

    // Validate avatarType
    if (!['generated', 'emoji', 'url'].includes(avatarType)) {
      return NextResponse.json({ error: 'Invalid avatarType' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        avatar,
        avatarType
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        avatarType: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Avatar update error:', error)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}