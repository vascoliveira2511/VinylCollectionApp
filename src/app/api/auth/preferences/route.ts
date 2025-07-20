import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      displayView: true,
      recordsPerPage: true,
      showGenreChart: true,
      showDecadeChart: true,
      showArtistChart: true,
      discogsEnabled: true
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const preferences = await request.json()

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      displayView: preferences.displayView,
      recordsPerPage: preferences.recordsPerPage ? parseInt(preferences.recordsPerPage) : undefined,
      showGenreChart: preferences.showGenreChart,
      showDecadeChart: preferences.showDecadeChart,
      showArtistChart: preferences.showArtistChart,
      discogsEnabled: preferences.discogsEnabled
    },
    select: {
      displayView: true,
      recordsPerPage: true,
      showGenreChart: true,
      showDecadeChart: true,
      showArtistChart: true,
      discogsEnabled: true
    }
  })

  return NextResponse.json(updatedUser)
}