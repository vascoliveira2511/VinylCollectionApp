import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import * as jose from 'jose'
import { prisma } from '@/lib/db'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        displayView: true,
        recordsPerPage: true,
        showGenreChart: true,
        showDecadeChart: true,
        discogsEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = payload.userId as string

    const preferences = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        displayView: preferences.displayView,
        recordsPerPage: typeof preferences.recordsPerPage === 'number' 
          ? preferences.recordsPerPage 
          : parseInt(preferences.recordsPerPage),
        showGenreChart: Boolean(preferences.showGenreChart),
        showDecadeChart: Boolean(preferences.showDecadeChart),
        discogsEnabled: Boolean(preferences.discogsEnabled)
      },
      select: {
        displayView: true,
        recordsPerPage: true,
        showGenreChart: true,
        showDecadeChart: true,
        discogsEnabled: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}