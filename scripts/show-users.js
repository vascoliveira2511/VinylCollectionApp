const { PrismaClient } = require('@prisma/client')

async function showUsers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📊 Users in database:')
    console.log('═══════════════════════')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        googleId: true,
        avatarType: true,
        createdAt: true,
        _count: {
          select: {
            vinyls: true,
            collections: true,
            sentFriendRequests: true,
            receivedFriendRequests: true
          }
        }
      }
    })

    if (users.length === 0) {
      console.log('No users found in database.')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email || 'N/A'}`)
        console.log(`   Google ID: ${user.googleId || 'N/A'}`)
        console.log(`   Avatar Type: ${user.avatarType}`)
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
        console.log(`   Vinyls: ${user._count.vinyls}`)
        console.log(`   Collections: ${user._count.collections}`)
        console.log(`   Friend Requests Sent: ${user._count.sentFriendRequests}`)
        console.log(`   Friend Requests Received: ${user._count.receivedFriendRequests}`)
        console.log('   ───────────────────')
      })
      
      console.log(`\n📈 Total users: ${users.length}`)
    }
    
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showUsers()