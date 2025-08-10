import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/db";
import { db } from "@/lib/db";

interface ImportRecord {
  artist: string;
  title: string;
  year?: number;
  genres?: string[];
  condition?: string;
  sleeveCondition?: string;
  rating?: number;
  description?: string;
  label?: string;
  format?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseLocation?: string;
  catalogNumber?: string;
  country?: string;
  discogsId?: number;
  imageUrl?: string;
  collectionName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const overwrite = formData.get("overwrite") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileContent = await file.text();
    let records: ImportRecord[] = [];

    try {
      if (file.name.endsWith(".json")) {
        // Parse JSON import
        const jsonData = JSON.parse(fileContent);
        
        if (jsonData.records && Array.isArray(jsonData.records)) {
          records = jsonData.records;
        } else if (Array.isArray(jsonData)) {
          records = jsonData;
        } else {
          throw new Error("Invalid JSON format");
        }
      } else if (file.name.endsWith(".csv")) {
        // Parse CSV import
        const lines = fileContent.split("\n").filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error("CSV file must have at least a header and one data row");
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const dataLines = lines.slice(1);

        records = dataLines.map(line => {
          const values = parseCSVLine(line);
          const record: any = {};

          headers.forEach((header, index) => {
            const value = values[index]?.trim().replace(/^"|"$/g, "");
            if (!value) return;

            switch (header.toLowerCase()) {
              case "artist":
                record.artist = value;
                break;
              case "title":
                record.title = value;
                break;
              case "year":
                const year = parseInt(value);
                if (!isNaN(year)) record.year = year;
                break;
              case "genres":
                record.genres = value.split(";").map(g => g.trim()).filter(g => g);
                break;
              case "condition":
                record.condition = value;
                break;
              case "sleeve condition":
                record.sleeveCondition = value;
                break;
              case "rating":
                const rating = parseInt(value);
                if (!isNaN(rating) && rating >= 1 && rating <= 5) record.rating = rating;
                break;
              case "description":
                record.description = value;
                break;
              case "label":
                record.label = value;
                break;
              case "format":
                record.format = value;
                break;
              case "purchase date":
                if (value && !isNaN(Date.parse(value))) {
                  record.purchaseDate = value;
                }
                break;
              case "purchase price":
                const price = parseFloat(value);
                if (!isNaN(price)) record.purchasePrice = price;
                break;
              case "purchase currency":
                record.purchaseCurrency = value;
                break;
              case "purchase location":
                record.purchaseLocation = value;
                break;
              case "catalog number":
                record.catalogNumber = value;
                break;
              case "country":
                record.country = value;
                break;
              case "discogs id":
                const discogsId = parseInt(value);
                if (!isNaN(discogsId)) record.discogsId = discogsId;
                break;
              case "image url":
                record.imageUrl = value;
                break;
              case "collection":
                record.collectionName = value;
                break;
            }
          });

          return record;
        }).filter(record => record.artist && record.title);
      } else {
        return NextResponse.json({ error: "Unsupported file format. Use CSV or JSON." }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Failed to parse file. Please check the format and try again.",
        details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "No valid records found in file" }, { status: 400 });
    }

    // Validate required fields
    const validRecords = records.filter(record => record.artist && record.title);
    if (validRecords.length === 0) {
      return NextResponse.json({ error: "No records with required fields (artist, title) found" }, { status: 400 });
    }

    // Get user's collections to map collection names
    const collections = await db.collection.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, isDefault: true }
    });

    const defaultCollection = collections.find(c => c.isDefault);
    const collectionMap = new Map(collections.map(c => [c.title.toLowerCase(), c.id]));

    // Process imports
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const record of validRecords) {
      try {
        // Determine collection
        let collectionId = defaultCollection?.id || null;
        if (record.collectionName) {
          const collectionIdFromMap = collectionMap.get(record.collectionName.toLowerCase());
          if (collectionIdFromMap) {
            collectionId = collectionIdFromMap;
          }
        }

        // Check for duplicates if not overwriting
        if (!overwrite) {
          const existing = await db.vinyl.findFirst({
            where: {
              userId: user.id,
              artist: record.artist,
              title: record.title,
              year: record.year || null,
            },
          });

          if (existing) {
            results.skipped++;
            continue;
          }
        }

        // Prepare vinyl data
        const vinylData = {
          userId: user.id,
          artist: record.artist,
          title: record.title,
          year: record.year || null,
          genres: JSON.stringify(record.genres || []),
          condition: record.condition || null,
          sleeveCondition: record.sleeveCondition || null,
          rating: record.rating || null,
          description: record.description || null,
          label: record.label || null,
          format: record.format || null,
          purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : null,
          purchasePrice: record.purchasePrice || null,
          purchaseCurrency: record.purchaseCurrency || null,
          purchaseLocation: record.purchaseLocation || null,
          catalogNumber: record.catalogNumber || null,
          country: record.country || null,
          discogsId: record.discogsId || null,
          imageUrl: record.imageUrl || null,
          collectionId,
        };

        if (overwrite) {
          // Try to update existing record
          const existing = await db.vinyl.findFirst({
            where: {
              userId: user.id,
              artist: record.artist,
              title: record.title,
              year: record.year || null,
            },
          });

          if (existing) {
            await db.vinyl.update({
              where: { id: existing.id },
              data: vinylData,
            });
            results.updated++;
          } else {
            await db.vinyl.create({ data: vinylData });
            results.imported++;
          }
        } else {
          // Create new record
          await db.vinyl.create({ data: vinylData });
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Failed to import "${record.artist} - ${record.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
}

// Helper function to properly parse CSV lines with quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current);

  return values;
}