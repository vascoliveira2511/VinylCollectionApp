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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCollections = await getAllCollections()
  const userCollection = allCollections[userId] || []
  const vinyl = userCollection.find((v: any) => v.id === parseInt(params.id))
  if (!vinyl) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }
  return NextResponse.json(vinyl)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCollections = await getAllCollections()
  const userCollection = allCollections[userId] || []

  const index = userCollection.findIndex((v: any) => v.id === parseInt(params.id))
  if (index === -1) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }
  const updatedVinyl = await request.json()
  // Ensure genre is an array
  if (typeof updatedVinyl.genre === 'string') {
    updatedVinyl.genre = updatedVinyl.genre.split(',').map((g: string) => g.trim()).filter((g: string) => g)
  }
  userCollection[index] = { ...userCollection[index], ...updatedVinyl }

  allCollections[userId] = userCollection
  await saveAllCollections(allCollections)

  return NextResponse.json(userCollection[index])
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCollections = await getAllCollections()
  let userCollection = allCollections[userId] || []

  const filteredCollection = userCollection.filter((v: any) => v.id !== parseInt(params.id))
  if (userCollection.length === filteredCollection.length) {
    return NextResponse.json({ error: 'Vinyl not found' }, { status: 404 })
  }
  userCollection = filteredCollection

  allCollections[userId] = userCollection
  await saveAllCollections(allCollections)

  return NextResponse.json({ message: 'Vinyl deleted successfully' })
}

