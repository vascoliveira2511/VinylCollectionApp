import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'
import { prisma } from '@/lib/db'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function POST(request: NextRequest) {
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