import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as jose from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function POST(request: NextRequest) {
  try {
    // Get current user from JWT
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = parseInt(payload.userId as string)
    
    let mergedCount = 0
    let removedCount = 0
    const errors: string[] = []
    
    // Get all user's vinyl records
    const allVinyls = await prisma.vinyl.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // Keep older records when merging
    })
    
    // Group by artist and title (case-insensitive)
    const groups = new Map<string, typeof allVinyls>()
    
    for (const vinyl of allVinyls) {
      const key = `${vinyl.artist.toLowerCase().trim()}-${vinyl.title.toLowerCase().trim()}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(vinyl)
    }
    
    // Process groups with duplicates
    for (const [key, vinyls] of groups.entries()) {
      if (vinyls.length > 1) {
        try {
          // Find the best record to keep (prefer one with Discogs ID, then most complete data)
          const keepRecord = vinyls.reduce((best, current) => {
            // Prefer records with Discogs ID
            if (current.discogsId && !best.discogsId) return current
            if (best.discogsId && !current.discogsId) return best
            
            // Count non-null fields
            const bestFields = Object.values(best).filter(v => v !== null && v !== '').length
            const currentFields = Object.values(current).filter(v => v !== null && v !== '').length
            
            return currentFields > bestFields ? current : best
          })
          
          const duplicates = vinyls.filter(v => v.id !== keepRecord.id)
          
          if (duplicates.length > 0) {
            // Merge data from duplicates into the keep record
            const mergedData: any = { ...keepRecord }
            
            for (const duplicate of duplicates) {
              // Merge non-null values
              if (!mergedData.discogsId && duplicate.discogsId) mergedData.discogsId = duplicate.discogsId
              if (!mergedData.imageUrl && duplicate.imageUrl) mergedData.imageUrl = duplicate.imageUrl
              if (!mergedData.year && duplicate.year) mergedData.year = duplicate.year
              if (!mergedData.label && duplicate.label) mergedData.label = duplicate.label
              if (!mergedData.format && duplicate.format) mergedData.format = duplicate.format
              if (!mergedData.catalogNumber && duplicate.catalogNumber) mergedData.catalogNumber = duplicate.catalogNumber
              if (!mergedData.rating && duplicate.rating) mergedData.rating = duplicate.rating
              if (!mergedData.description && duplicate.description) mergedData.description = duplicate.description
              if (!mergedData.condition && duplicate.condition) mergedData.condition = duplicate.condition
              if (!mergedData.purchaseDate && duplicate.purchaseDate) mergedData.purchaseDate = duplicate.purchaseDate
              if (!mergedData.purchasePrice && duplicate.purchasePrice) mergedData.purchasePrice = duplicate.purchasePrice
              if (!mergedData.purchaseLocation && duplicate.purchaseLocation) mergedData.purchaseLocation = duplicate.purchaseLocation
              if (!mergedData.country && duplicate.country) mergedData.country = duplicate.country
              
              // Merge genres
              if (mergedData.genres === '[]' && duplicate.genres !== '[]') {
                mergedData.genres = duplicate.genres
              }
            }
            
            // Update the keep record with merged data
            await prisma.vinyl.update({
              where: { id: keepRecord.id },
              data: {
                discogsId: mergedData.discogsId,
                imageUrl: mergedData.imageUrl,
                year: mergedData.year,
                label: mergedData.label,
                format: mergedData.format,
                catalogNumber: mergedData.catalogNumber,
                rating: mergedData.rating,
                description: mergedData.description,
                condition: mergedData.condition,
                purchaseDate: mergedData.purchaseDate,
                purchasePrice: mergedData.purchasePrice,
                purchaseLocation: mergedData.purchaseLocation,
                country: mergedData.country,
                genres: mergedData.genres,
              },
            })
            
            // Delete duplicate records
            await prisma.vinyl.deleteMany({
              where: {
                id: { in: duplicates.map(d => d.id) },
                userId,
              },
            })
            
            mergedCount++
            removedCount += duplicates.length
          }
        } catch (error) {
          console.error('Error processing duplicate group:', key, error)
          errors.push(`Failed to merge duplicates for "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
    
    return NextResponse.json({
      message: 'Duplicate cleanup completed',
      mergedCount,
      removedCount,
      errors: errors.slice(0, 10), // Return first 10 errors only
    })
    
  } catch (error) {
    console.error('Duplicate cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates' },
      { status: 500 }
    )
  }
}