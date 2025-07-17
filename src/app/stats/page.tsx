'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'
import ChartComponent from '../components/ChartComponent'

interface Vinyl {
  id: number
  artist: string
  title: string
  year: number
  imageUrl: string
  genre: string
}

export default function Stats() {
  const [collection, setCollection] = useState<Vinyl[]>([])
  const [genreStats, setGenreStats] = useState<Record<string, number>>({})
  const [yearStats, setYearStats] = useState<Record<string, number>>({})
  const [artistStats, setArtistStats] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    fetch('/api/collection')
      .then((res) => {
        if (!res.ok) {
          router.push('/login')
        } else {
          return res.json()
        }
      })
      .then((data: Vinyl[]) => {
        setCollection(data)

        const genreCounts: Record<string, number> = {}
        const yearCounts: Record<string, number> = {}
        const artistCounts: Record<string, number> = {}

        data.forEach((vinyl) => {
          if (Array.isArray(vinyl.genre)) {
            vinyl.genre.forEach((g) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1
            })
          } else if (typeof vinyl.genre === 'string') {
            // Fallback for old data format if needed
            vinyl.genre.split(',').map(g => g.trim()).filter(g => g).forEach(g => {
              genreCounts[g] = (genreCounts[g] || 0) + 1
            })
          }
          yearCounts[vinyl.year] = (yearCounts[vinyl.year] || 0) + 1
          artistCounts[vinyl.artist] = (artistCounts[vinyl.artist] || 0) + 1
        })

        setGenreStats(genreCounts)
        setYearStats(yearCounts)
        setArtistStats(artistCounts)
      })
  }, [router])

  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Collection Statistics</div>
          <div className={styles.contentSection}>
            <h1>Your Collection Stats</h1>
            <p>Total Records: {collection.length}</p>

            <h2>Records by Genre:</h2>
            <ChartComponent data={genreStats} title="Records by Genre" type="pie" />

            <h2>Records by Year:</h2>
            <ChartComponent data={yearStats} title="Records by Year" type="bar" />

            <h2>Records by Artist:</h2>
            <ChartComponent data={artistStats} title="Records by Artist" type="bar" />
          </div>
        </div>
      </div>
    </main>
  )
}
