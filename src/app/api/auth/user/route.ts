import { NextResponse } from 'next/server'
import * as jose from 'jose'
import path from 'path'
import fs from 'fs/promises'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)
const collectionFilePath = path.join(process.cwd(), 'data', 'collection.json')

async function getAllCollections() {
  try {
    const data = await fs.readFile(collectionFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

export async function GET(request: Request) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = payload.userId as string
    const username = payload.username as string

    const allCollections = await getAllCollections()
    const userCollection = allCollections[userId] || []

    const totalRecords = userCollection.length
    const genreStats: Record<string, number> = {}
    userCollection.forEach((vinyl: any) => {
      if (Array.isArray(vinyl.genre)) {
        vinyl.genre.forEach((g: string) => {
          genreStats[g] = (genreStats[g] || 0) + 1
        })
      } else if (typeof vinyl.genre === 'string') {
        // Handle old format if necessary, though it should be an array now
        vinyl.genre.split(',').map((g: string) => g.trim()).filter((g: string) => g).forEach((g: string) => {
          genreStats[g] = (genreStats[g] || 0) + 1
        })
      }
    })

    const recentVinyls = userCollection.sort((a: any, b: any) => b.id - a.id).slice(0, 5);

    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    const users = JSON.parse(await fs.readFile(usersFilePath, 'utf-8'))
    const currentUser = users.find((u: any) => u.id === parseInt(userId))
    const discogsUsername = currentUser ? currentUser.discogsUsername : undefined

    return NextResponse.json({ username, totalRecords, genreStats, recentVinyls, discogsUsername })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

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

export async function PUT(request: Request) {
  const userId = request.headers.get('x-user-id')
  // console.log('PUT /api/auth/user: userId', userId) // Commented out for production
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { discogsUsername } = await request.json()
  // console.log('PUT /api/auth/user: Received discogsUsername', discogsUsername) // Commented out for production

  const users = await getUsers()
  const userIndex = users.findIndex((u: any) => u.id === parseInt(userId))

  if (userIndex === -1) {
    // console.error('PUT /api/auth/user: User not found for userId', userId) // Commented out for production
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  users[userIndex] = { ...users[userIndex], discogsUsername }
  // console.log('PUT /api/auth/user: Updated user object', users[userIndex]) // Commented out for production
  await saveUsers(users)
  // console.log('PUT /api/auth/user: Users saved to file') // Commented out for production

  // Import Discogs collection to local collection
  if (discogsUsername) {
    try {
      const discogsCollectionUrl = `${request.nextUrl.origin}/api/discogs/user-collection-stats?username=${encodeURIComponent(discogsUsername)}&per_page=100` // Fetch more items
      const discogsRes = await fetch(discogsCollectionUrl)
      if (discogsRes.ok) {
        const discogsData = await discogsRes.json()
        const discogsReleases = discogsData.discogsReleases || []
        // console.log('PUT /api/auth/user: Discogs releases fetched', discogsReleases.length, 'items') // Commented out for production

        const allCollections = await getAllCollections()
        let userCollection = allCollections[userId] || []
        // console.log('PUT /api/auth/user: Local collection before import', userCollection.length, 'items') // Commented out for production

        discogsReleases.forEach((discogsVinyl: any) => {
          // Check if vinyl already exists in local collection by Discogs ID
          const exists = userCollection.some((localVinyl: any) => localVinyl.discogsId === discogsVinyl.id)
          // console.log(`PUT /api/auth/user: Processing Discogs vinyl ${discogsVinyl.title} (ID: ${discogsVinyl.id}), Exists locally: ${exists}`) // Commented out for production
          if (!exists) {
            // Add to local collection
            const newLocalVinyl = {
              id: userCollection.length > 0 ? Math.max(...userCollection.map((v: any) => v.id)) + 1 : 1,
              discogsId: discogsVinyl.id, // Store Discogs ID for future reference
              artist: discogsVinyl.artist,
              title: discogsVinyl.title,
              year: discogsVinyl.year,
              imageUrl: discogsVinyl.imageUrl,
              genre: discogsVinyl.genre,
            }
            userCollection.push(newLocalVinyl)
            // console.log('PUT /api/auth/user: Added to local collection', newLocalVinyl.title) // Commented out for production
          }
        })

        allCollections[userId] = userCollection
        await fs.writeFile(collectionFilePath, JSON.stringify(allCollections, null, 2))
        // console.log('PUT /api/auth/user: Local collection after import', userCollection.length, 'items') // Commented out for production
        // console.log('PUT /api/auth/user: Discogs collection imported to local collection.') // Commented out for production
      } else {
        console.error('Failed to fetch Discogs collection from internal API', discogsRes.status, discogsRes.statusText)
      }
    } catch (error) {
      console.error('Error importing Discogs collection:', error)
    }
  }

  return NextResponse.json({ message: 'Discogs username updated successfully' })
}
