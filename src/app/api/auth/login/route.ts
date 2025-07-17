import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

async function getUsers() {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const users = await getUsers()

  const user = users.find((u: any) => u.username === username)
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await new jose.SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret)

  const response = NextResponse.json({ message: 'Login successful' })
  response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
  return response
}
