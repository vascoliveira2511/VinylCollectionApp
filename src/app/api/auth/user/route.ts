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

    return NextResponse.json({ username, totalRecords, genreStats, recentVinyls })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

