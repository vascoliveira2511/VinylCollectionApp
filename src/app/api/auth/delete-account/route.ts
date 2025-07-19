import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password, confirmDelete } = await request.json()

  if (!password || confirmDelete !== 'DELETE') {
    return NextResponse.json({ error: 'Password and confirmation required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 })
    }

    // Delete user and all associated vinyls (cascade should handle this)
    await prisma.user.delete({
      where: { id: parseInt(userId) }
    })

    const response = NextResponse.json({ message: 'Account deleted successfully' })
    response.cookies.delete('token')
    return response
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}