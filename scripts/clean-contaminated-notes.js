#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanContaminatedNotes() {
  console.log('🔍 Checking for contaminated personal notes...\n');
  
  try {
    // Find all vinyls that have descriptions (personal notes)
    const vinylsWithDescriptions = await prisma.vinyl.findMany({
      where: {
        description: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        artist: true,
        description: true,
        discogsId: true
      }
    });

    console.log(`Found ${vinylsWithDescriptions.length} vinyls with personal notes\n`);

    let contaminatedCount = 0;
    let cleanedCount = 0;

    for (const vinyl of vinylsWithDescriptions) {
      const description = vinyl.description;
      
      // Check if description contains typical Discogs release note patterns
      const hasDiscogsPatterns = (
        description.includes('[url=') ||
        description.includes('[r12') ||
        description.includes('[r13') ||
        description.includes('Made in the EU') ||
        description.includes('Anniversary box set') ||
        description.includes('Not to be confused with') ||
        description.includes('Pressed on') ||
        description.includes('℗ 20') ||
        description.includes('© 20') ||
        description.includes('lacquers from') ||
        description.includes('Sony Interactive Entertainment') ||
        description.length > 1000 // Very long descriptions are likely release notes
      );

      if (hasDiscogsPatterns) {
        contaminatedCount++;
        console.log(`🟡 CONTAMINATED: "${vinyl.title}" by ${vinyl.artist}`);
        console.log(`   Description length: ${description.length} chars`);
        console.log(`   Contains Discogs patterns: Yes`);
        console.log(`   Sample: ${description.substring(0, 100)}...`);
        
        // Clean it up by setting description to null
        await prisma.vinyl.update({
          where: { id: vinyl.id },
          data: { description: null }
        });
        
        cleanedCount++;
        console.log(`   ✅ Cleaned up!\n`);
      } else {
        console.log(`🟢 CLEAN: "${vinyl.title}" by ${vinyl.artist}`);
        console.log(`   Description: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n`);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log(`📊 SUMMARY:`);
    console.log(`   Total vinyls with descriptions: ${vinylsWithDescriptions.length}`);
    console.log(`   Contaminated records found: ${contaminatedCount}`);
    console.log(`   Records cleaned: ${cleanedCount}`);
    console.log(`   Clean personal notes remaining: ${vinylsWithDescriptions.length - contaminatedCount}`);
    console.log('═══════════════════════════════════════');

    if (cleanedCount > 0) {
      console.log(`\n✅ Successfully cleaned ${cleanedCount} contaminated records!`);
      console.log('Your personal notes are now separate from Discogs release notes.');
    } else {
      console.log('\n🎉 No contaminated records found! Your personal notes are clean.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanContaminatedNotes().catch(console.error);
}

module.exports = { cleanContaminatedNotes };