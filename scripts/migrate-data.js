const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function migrateData() {
  try {
    console.log('Starting data migration...')

    // Read users from JSON file
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    let users = []
    try {
      const usersData = fs.readFileSync(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch (error) {
      console.log('No users.json found or error reading it')
    }

    // Migrate users
    for (const user of users) {
      const existingUser = await prisma.user.findUnique({
        where: { username: user.username }
      })
      
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            password: user.password,
            discogsUsername: user.discogsUsername || null
          }
        })
        console.log(`Migrated user: ${user.username}`)
      } else {
        console.log(`User ${user.username} already exists, skipping`)
      }
    }

    // Read collections from JSON file
    const collectionsPath = path.join(process.cwd(), 'data', 'collection.json')
    let collections = {}
    try {
      const collectionsData = fs.readFileSync(collectionsPath, 'utf-8')
      collections = JSON.parse(collectionsData)
    } catch (error) {
      console.log('No collection.json found or error reading it')
    }

    // Migrate collections
    for (const [userId, vinyls] of Object.entries(collections)) {
      for (const vinyl of vinyls) {
        const existingVinyl = await prisma.vinyl.findFirst({
          where: {
            discogsId: vinyl.discogsId,
            userId: parseInt(userId)
          }
        })

        if (!existingVinyl) {
          await prisma.vinyl.create({
            data: {
              discogsId: vinyl.discogsId,
              artist: vinyl.artist,
              title: vinyl.title,
              year: vinyl.year,
              imageUrl: vinyl.imageUrl,
              genres: JSON.stringify(vinyl.genre || []),
              userId: parseInt(userId)
            }
          })
          console.log(`Migrated vinyl: ${vinyl.artist} - ${vinyl.title} for user ${userId}`)
        } else {
          console.log(`Vinyl ${vinyl.artist} - ${vinyl.title} already exists for user ${userId}, skipping`)
        }
      }
    }

    console.log('Data migration completed successfully!')
  } catch (error) {
    console.error('Error during migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()