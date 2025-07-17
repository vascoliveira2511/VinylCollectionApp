import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import bcrypt from 'bcryptjs'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

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

async function saveUsers(users: any) {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))
}

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const users = await getUsers()

  const existingUser = users.find((u: any) => u.username === username)
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = { id: users.length + 1, username, password: hashedPassword }
  users.push(newUser)
  await saveUsers(users)

  return NextResponse.json({ message: 'User created successfully' })
}
