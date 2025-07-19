const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDefaultCollections() {
  try {
    console.log('Creating default collections for existing users...')
    
    // Get all users
    const users = await prisma.user.findMany()
    
    for (const user of users) {
      // Check if user already has a default collection
      const existingDefault = await prisma.collection.findFirst({
        where: {
          userId: user.id,
          isDefault: true
        }
      })
      
      if (!existingDefault) {
        // Create default collection
        const defaultCollection = await prisma.collection.create({
          data: {
            title: 'My Collection',
            description: 'Default vinyl collection',
            isDefault: true,
            userId: user.id
          }
        })
        
        // Move all user's vinyls to the default collection
        await prisma.vinyl.updateMany({
          where: {
            userId: user.id,
            collectionId: null
          },
          data: {
            collectionId: defaultCollection.id
          }
        })
        
        console.log(`Created default collection for user: ${user.username}`)
      } else {
        console.log(`User ${user.username} already has a default collection`)
      }
    }
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultCollections()