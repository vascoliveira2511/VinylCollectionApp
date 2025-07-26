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
    const username = payload.username as string

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { 
        id: true, 
        username: true, 
        createdAt: true,
        avatar: true,
        avatarType: true,
        displayView: true,
        recordsPerPage: true,
        showGenreChart: true,
        showDecadeChart: true,
        discogsEnabled: true,
        discogsUsername: true,
        discogsAccessToken: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const vinyls = await prisma.vinyl.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    })

    const totalRecords = vinyls.length
    const genreStats: Record<string, number> = {}
    vinyls.forEach((vinyl) => {
      const genres = JSON.parse(vinyl.genres)
      if (Array.isArray(genres)) {
        genres.forEach((g: string) => {
          genreStats[g] = (genreStats[g] || 0) + 1
        })
      }
    })

    const recentVinyls = vinyls.slice(0, 5).map(vinyl => ({
      ...vinyl,
      genre: JSON.parse(vinyl.genres)
    }))

    return NextResponse.json({ 
      id: user.id,
      username: user.username, 
      createdAt: user.createdAt,
      avatar: user.avatar,
      avatarType: user.avatarType,
      displayView: user.displayView,
      recordsPerPage: user.recordsPerPage,
      showGenreChart: user.showGenreChart,
      showDecadeChart: user.showDecadeChart,
      discogsEnabled: user.discogsEnabled,
      discogsUsername: user.discogsUsername,
      discogsAccessToken: user.discogsAccessToken ? 'connected' : null, // Don't expose actual token
      totalRecords, 
      genreStats, 
      recentVinyls 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

