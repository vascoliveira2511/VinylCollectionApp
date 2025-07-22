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
  const [showArtistChart, setShowArtistChart] = useState(false)
  const [showCountryChart, setShowCountryChart] = useState(true)
  const [showStyleChart, setShowStyleChart] = useState(true)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const userRes = await fetch('/api/auth/user')
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserPreferences(userData)
          setShowGenreChart(userData.showGenreChart !== undefined ? userData.showGenreChart : true)
          setShowYearChart(userData.showDecadeChart !== undefined ? userData.showDecadeChart : true)
          setShowArtistChart(userData.showArtistChart !== undefined ? userData.showArtistChart : false)
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error)
      }
    }
    
    fetchUserPreferences()
  }, [])

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
    <main className={`${styles.main} stats-page`}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Collection Statistics</div>
          <div className={styles.contentSection}>
            <div className={styles.statsHeader}>
              <h1>Your Collection Stats</h1>
              <p className={styles.totalRecordsText}>Total Records: {collection.length}</p>
            </div>

            <div className={styles.chartControls}>
              <h3>Chart Visibility</h3>
              <div className={styles.checkboxGrid}>
                <label className={styles.chartCheckbox}>
                  <input type="checkbox" checked={showGenreChart} onChange={() => setShowGenreChart(!showGenreChart)} />
                  <span>Genre Chart</span>
                </label>
                <label className={styles.chartCheckbox}>
                  <input type="checkbox" checked={showYearChart} onChange={() => setShowYearChart(!showYearChart)} />
                  <span>Year Chart</span>
                </label>
                <label className={styles.chartCheckbox}>
                  <input type="checkbox" checked={showArtistChart} onChange={() => setShowArtistChart(!showArtistChart)} />
                  <span>Artist Chart</span>
                </label>
                <label className={styles.chartCheckbox}>
                  <input type="checkbox" checked={showCountryChart} onChange={() => setShowCountryChart(!showCountryChart)} />
                  <span>Country Chart</span>
                </label>
                <label className={styles.chartCheckbox}>
                  <input type="checkbox" checked={showStyleChart} onChange={() => setShowStyleChart(!showStyleChart)} />
                  <span>Style Chart</span>
                </label>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              {showGenreChart && (
                <div className={styles.chartCard}>
                  <h2>Records by Genre</h2>
                  <ChartComponent data={genreStats} title="Records by Genre" type="pie" />
                </div>
              )}

              {showYearChart && (
                <div className={styles.chartCard}>
                  <h2>Records by Year</h2>
                  <ChartComponent data={yearStats} title="Records by Year" type="bar" />
                </div>
              )}

              {showArtistChart && (
                <div className={styles.chartCard}>
                  <h2>Records by Artist</h2>
                  <ChartComponent data={artistStats} title="Records by Artist" type="bar" />
                </div>
              )}

              {showCountryChart && (
                <div className={styles.chartCard}>
                  <h2>Records by Country</h2>
                  <ChartComponent data={countryStats} title="Records by Country" type="bar" />
                </div>
              )}

              {showStyleChart && (
                <div className={styles.chartCard}>
                  <h2>Records by Style</h2>
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
