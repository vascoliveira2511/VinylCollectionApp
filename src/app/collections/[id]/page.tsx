'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../page.module.css'

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
}

interface Collection {
  id: number
  title: string
  description?: string
  isDefault: boolean
  createdAt: string
  vinyls: Vinyl[]
  _count: {
    vinyls: number
  }
}

export default function CollectionView({ params }: { params: { id: string } }) {
  const { id } = params
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [filterArtist, setFilterArtist] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [displayLimit, setDisplayLimit] = useState(12)
  
  const router = useRouter()

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 404) {
          setError('Collection not found')
          return
        }
        throw new Error('Failed to fetch collection')
      }
      const data = await res.json()
      setCollection(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCollection()
    }
  }, [id, router])

  const filteredVinyls = collection ? collection.vinyls.filter((vinyl) => {
    const matchesArtist = filterArtist === '' || vinyl.artist.toLowerCase().includes(filterArtist.toLowerCase())
    const matchesTitle = filterTitle === '' || vinyl.title.toLowerCase().includes(filterTitle.toLowerCase())
    const matchesGenre = filterGenre === '' || vinyl.genre.some(g => g.toLowerCase().includes(filterGenre.toLowerCase()))
    const matchesYear = filterYear === '' || vinyl.year.toString().includes(filterYear)
    return matchesArtist && matchesTitle && matchesGenre && matchesYear
  }).slice(0, displayLimit) : []

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading collection...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !collection) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p style={{ color: 'var(--ctp-red)' }}>{error || 'Collection not found'}</p>
              <Link href="/collections">
                <button>Back to Collections</button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Collection Header */}
        <div className="window">
          <div className="title-bar">
            {collection.title}
            {collection.isDefault && <span className={styles.defaultBadge}>Default</span>}
          </div>
          <div className={styles.contentSection}>
            <div className={styles.collectionHeader}>
              <div className={styles.collectionInfo}>
                {collection.description && (
                  <p className={styles.collectionDescription}>{collection.description}</p>
                )}
                <p className={styles.collectionStats}>
                  {collection._count.vinyls} record{collection._count.vinyls !== 1 ? 's' : ''} in this collection
                </p>
              </div>
              <div className={styles.collectionActions}>
                <Link href="/collections">
                  <button className={styles.backButton}>Back to Collections</button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {collection.vinyls.length > 0 && (
          <div className="window">
            <div className="title-bar">Filter Records</div>
            <div className={styles.contentSection}>
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
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                >
                  <option value={12}>Show 12</option>
                  <option value={24}>Show 24</option>
                  <option value={48}>Show 48</option>
                  <option value={collection.vinyls.length}>Show All</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Records Grid */}
        <div className="window">
          <div className="title-bar">Records ({filteredVinyls.length})</div>
          <div className={styles.contentSection}>
            {filteredVinyls.length > 0 ? (
              <div className={styles.collectionGrid}>
                {filteredVinyls.map((vinyl) => (
                  <Link href={`/collection/${vinyl.id}`} key={vinyl.id} className={styles.card}>
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
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                {collection.vinyls.length === 0 ? (
                  <p>This collection is empty. Add some records to get started!</p>
                ) : (
                  <p>No records match your current filters.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}