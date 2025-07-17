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
  genre: string[]
  discogsId?: number
  country?: string
  style?: string[]
}

export default function Stats() {
  const [collection, setCollection] = useState<Vinyl[]>([])
  const [genreStats, setGenreStats] = useState<Record<string, number>>({})
  const [yearStats, setYearStats] = useState<Record<string, number>>({})
  const [artistStats, setArtistStats] = useState<Record<string, number>>({})
  const [countryStats, setCountryStats] = useState<Record<string, number>>({})
  const [styleStats, setStyleStats] = useState<Record<string, number>>({})

  // State for chart visibility
  const [showGenreChart, setShowGenreChart] = useState(true)
  const [showYearChart, setShowYearChart] = useState(true)
  const [showArtistChart, setShowArtistChart] = useState(true)
  const [showCountryChart, setShowCountryChart] = useState(true)
  const [showStyleChart, setShowStyleChart] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/collection')
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setCollection(data)

        const genreCounts: Record<string, number> = {}
        const yearCounts: Record<string, number> = {}
        const artistCounts: Record<string, number> = {}
        const countryCounts: Record<string, number> = {}
        const styleCounts: Record<string, number> = {}

        const fetchDiscogsDetailsPromises = data.map(async (vinyl: any) => {
          if (vinyl.discogsId) {
            try {
              const discogsRes = await fetch(`/api/discogs/release/${vinyl.discogsId}`)
              if (discogsRes.ok) {
                const discogsData = await discogsRes.json()
                if (discogsData.country) {
                  countryCounts[discogsData.country] = (countryCounts[discogsData.country] || 0) + 1
                }
                if (discogsData.styles && Array.isArray(discogsData.styles)) {
                  discogsData.styles.forEach((style: string) => {
                    styleCounts[style] = (styleCounts[style] || 0) + 1
                  })
                }
              } else {
                console.error(`Failed to fetch Discogs details for ${vinyl.discogsId}:`, discogsRes.statusText)
              }
            } catch (error) {
              console.error(`Error fetching Discogs details for ${vinyl.discogsId}:`, error)
            }
          }

          // Existing stat calculations
          if (Array.isArray(vinyl.genre)) {
            vinyl.genre.forEach((g: string) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1
            })
          } else if (typeof vinyl.genre === 'string') {
            vinyl.genre.split(',').map((g: string) => g.trim()).filter((g: string) => g).forEach((g: string) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1
            })
          }
          yearCounts[vinyl.year] = (yearCounts[vinyl.year] || 0) + 1
          artistCounts[vinyl.artist] = (artistCounts[vinyl.artist] || 0) + 1
        })

        await Promise.all(fetchDiscogsDetailsPromises)

        setGenreStats(genreCounts)
        setYearStats(yearCounts)
        setArtistStats(artistCounts)
        setCountryStats(countryCounts)
        setStyleStats(styleCounts)
      } catch (error) {
        console.error("Error fetching stats data:", error)
      }
    }

    fetchData()
  }, [router])

  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className={styles.contentSection}>
            <h1>Your Collection Stats</h1>
            <p>Total Records: {collection.length}</p>

            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={showGenreChart} onChange={() => setShowGenreChart(!showGenreChart)} />
                Genre Chart
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={showYearChart} onChange={() => setShowYearChart(!showYearChart)} />
                Year Chart
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={showArtistChart} onChange={() => setShowArtistChart(!showArtistChart)} />
                Artist Chart
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={showCountryChart} onChange={() => setShowCountryChart(!showCountryChart)} />
                Country Chart
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={showStyleChart} onChange={() => setShowStyleChart(!showStyleChart)} />
                Style Chart
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 50%), 1fr))', gap: '30px' }}>
              {showGenreChart && (
                <div>
                  <h2>Records by Genre:</h2>
                  <ChartComponent data={genreStats} title="Records by Genre" type="pie" />
                </div>
              )}

              {showYearChart && (
                <div>
                  <h2>Records by Year:</h2>
                  <ChartComponent data={yearStats} title="Records by Year" type="bar" />
                </div>
              )}

              {showArtistChart && (
                <div>
                  <h2>Records by Artist:</h2>
                  <ChartComponent data={artistStats} title="Records by Artist" type="bar" />
                </div>
              )}

              {showCountryChart && (
                <div>
                  <h2>Records by Country:</h2>
                  <ChartComponent data={countryStats} title="Records by Country" type="bar" />
                </div>
              )}

              {showStyleChart && (
                <div>
                  <h2>Records by Style:</h2>
                  <ChartComponent data={styleStats} title="Records by Style" type="bar" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
