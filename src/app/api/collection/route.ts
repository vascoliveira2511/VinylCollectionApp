import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const filePath = path.join(process.cwd(), 'data', 'collection.json')

async function getAllCollections() {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function saveAllCollections(allCollections: any) {
  await fs.writeFile(filePath, JSON.stringify(allCollections, null, 2))
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  console.log('API Collection GET: userId', userId)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCollections = await getAllCollections()
  const userCollection = allCollections[userId] || []
  return NextResponse.json(userCollection)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  console.log('API Collection POST: userId', userId)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCollections = await getAllCollections()
  const userCollection = allCollections[userId] || []

  const newVinyl = await request.json()
  newVinyl.id = userCollection.length > 0 ? Math.max(...userCollection.map((v: any) => v.id)) + 1 : 1
  // Ensure genre is an array
  if (typeof newVinyl.genre === 'string') {
    newVinyl.genre = newVinyl.genre.split(',').map((g: string) => g.trim()).filter((g: string) => g)
  }
  userCollection.push(newVinyl)

  allCollections[userId] = userCollection
  await saveAllCollections(allCollections)

  return NextResponse.json(userCollection)
}
