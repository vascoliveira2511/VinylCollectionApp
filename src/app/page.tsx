'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Vinyl {
  id: number
  artist: string
  title: string
  year: number
  imageUrl: string
  genre: string[]
  discogsId?: number
  createdAt?: string
  updatedAt?: string
  collection?: {
    id: number
    title: string
    isDefault: boolean
  }
  // New manual fields
  trackList?: string[]
  description?: string
  label?: string
  format?: string
  condition?: string
  rating?: number
  purchaseDate?: string
  purchasePrice?: number
  purchaseLocation?: string
  catalogNumber?: string
  country?: string
}

interface Collection {
  id: number
  title: string
  description?: string
  isDefault: boolean
  _count: {
    vinyls: number
  }
}

interface UserProfile {
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
}

export default function Home() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [filterArtist, setFilterArtist] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterCollection, setFilterCollection] = useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(24)

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userRes = await fetch('/api/auth/user')
        if (!userRes.ok) {
          if (userRes.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch user profile')
        }
        const userData = await userRes.json()
        setUserProfile(userData)

        // Fetch collections
        const collectionsRes = await fetch('/api/collections')
        if (!collectionsRes.ok) {
          if (collectionsRes.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch collections')
        }
        const collectionsData = await collectionsRes.json()
        setCollections(collectionsData)

        // Fetch vinyls
        await fetchVinyls()
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const fetchVinyls = async (collectionFilter?: string) => {
    try {
      let url = '/api/collection'
      if (collectionFilter && collectionFilter !== 'all') {
        url += `?collectionId=${collectionFilter}`
      }
      
      const vinylsRes = await fetch(url)
      if (!vinylsRes.ok) {
        throw new Error('Failed to fetch vinyls')
      }
      const vinylsData = await vinylsRes.json()
      setVinyls(vinylsData)
    } catch (error) {
      console.error('Error fetching vinyls:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  useEffect(() => {
    if (collections.length > 0) {
      fetchVinyls(filterCollection)
    }
  }, [filterCollection, collections])

  const deleteVinyl = async (id: number) => {
    try {
      setError(null)
      const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete vinyl')
      
      // Refresh data
      const collectionRes = await fetch('/api/collection')
      if (collectionRes.ok) {
        const collectionData = await collectionRes.json()
        setVinyls(collectionData)
      }
      
      const userRes = await fetch('/api/auth/user')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserProfile(userData)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const filteredVinyls = vinyls.filter((vinyl) => {
    const matchesArtist = filterArtist === '' || vinyl.artist.toLowerCase().includes(filterArtist.toLowerCase())
    const matchesTitle = filterTitle === '' || vinyl.title.toLowerCase().includes(filterTitle.toLowerCase())
    const matchesGenre = filterGenre === '' || vinyl.genre.some(g => g.toLowerCase().includes(filterGenre.toLowerCase()))
    const matchesYear = filterYear === '' || vinyl.year.toString().includes(filterYear)
    return matchesArtist && matchesTitle && matchesGenre && matchesYear
  }).slice(0, displayLimit)

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Loading...</div>
            <div className={styles.contentSection}>
              <p>Loading your vinyl collection...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Error</div>
            <div className={styles.contentSection}>
              <p style={{ color: 'var(--ctp-red)' }}>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Your Vinyl Collection</div>
          <div className={styles.contentSection}>
            <div className={styles.browseIntro}>
              <h2>Your Vinyl Records ({vinyls.length} total)</h2>
              <p>Browse, filter, and manage your entire vinyl collection. Click any record to view details or edit information.</p>
              <div className={styles.browseActions}>
                <Link href="/collections" className={styles.manageButton}>
                  📚 Manage Collections
                </Link>
                <Link href="/profile" className={styles.statsButton}>
                  📊 View Statistics
                </Link>
                <Link href="/add" className={styles.addButton}>
                  ➕ Add New Vinyl
                </Link>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <div className={styles.filterSection}>
              <h3>Filter Records</h3>
              <div className={styles.filters}>
                <input
                  type="text"
                  placeholder="Filter by Artist"
                  value={filterArtist}
                  onChange={(e) => setFilterArtist(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Filter by Title"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Filter by Genre"
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Filter by Year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                />
                <select
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                >
                  <option value="all">All Collections</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id.toString()}>
                      {collection.title} ({collection._count.vinyls})
                    </option>
                  ))}
                </select>
                <select
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                >
                  <option value={12}>Show 12</option>
                  <option value={24}>Show 24</option>
                  <option value={48}>Show 48</option>
                  <option value={vinyls.length}>Show All</option>
                </select>
              </div>
            </div>

            <div className={styles.collectionGrid}>
              {filteredVinyls.map((vinyl) => (
                <div key={vinyl.id} className={styles.card}>
                  <Link href={`/vinyl/${vinyl.id}`}>
                    <img 
                      src={`/api/image-proxy?url=${encodeURIComponent(vinyl.imageUrl || 'https://via.placeholder.com/150')}`} 
                      alt={`${vinyl.title} cover`} 
                      className={styles.albumArt} 
                    />
                    <h3>{vinyl.title}</h3>
                    <p>{vinyl.artist}</p>
                    <p>{vinyl.year}</p>
                    <div className={styles.genrePills}>
                      {vinyl.genre.map((g, idx) => (
                        <span key={idx} className={styles.genrePill}>{g}</span>
                      ))}
                    </div>
                  </Link>
                  <div className={styles.buttonGroup}>
                    <Link href={`/vinyl/${vinyl.id}/edit`} className={styles.editButton}>
                      ✏️ Edit
                    </Link>
                    <button className="delete-btn" onClick={(e) => { e.preventDefault(); deleteVinyl(vinyl.id); }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredVinyls.length === 0 && (
              <div className={styles.emptyState}>
                <p>No vinyl records found. Try adjusting your filters or <Link href="/add">add some records</Link>!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}