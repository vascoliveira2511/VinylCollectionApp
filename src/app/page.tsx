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
}

interface Suggestion {
  artist: string
  title: string
  genre: string[]
  style: string[]
}

interface UserProfile {
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
}

export default function Home() {
  const [collection, setCollection] = useState<Vinyl[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  
  // Filter states
  const [filterArtist, setFilterArtist] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [displayLimit, setDisplayLimit] = useState(12)

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

        // Fetch collection
        const collectionRes = await fetch('/api/collection')
        if (!collectionRes.ok) {
          if (collectionRes.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch collection')
        }
        const collectionData = await collectionRes.json()
        setCollection(collectionData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const addOrUpdateVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!artist || !title || !year) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError(null)
      const vinylData = { 
        artist, 
        title, 
        year: parseInt(year), 
        imageUrl, 
        genre 
      }

      if (editingVinyl) {
        const res = await fetch(`/api/collection/${editingVinyl.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        if (!res.ok) throw new Error('Failed to update vinyl')
      } else {
        const res = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        if (!res.ok) throw new Error('Failed to add vinyl')
      }

      // Reset form
      setArtist('')
      setTitle('')
      setYear('')
      setImageUrl('')
      setGenre([])
      setEditingVinyl(null)
      setSuggestions([])
      
      // Refresh data
      const collectionRes = await fetch('/api/collection')
      if (collectionRes.ok) {
        const collectionData = await collectionRes.json()
        setCollection(collectionData)
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

  const deleteVinyl = async (id: number) => {
    try {
      setError(null)
      const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete vinyl')
      
      // Refresh data
      const collectionRes = await fetch('/api/collection')
      if (collectionRes.ok) {
        const collectionData = await collectionRes.json()
        setCollection(collectionData)
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

  const startEditing = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl)
    setArtist(vinyl.artist)
    setTitle(vinyl.title)
    setYear(vinyl.year.toString())
    setImageUrl(vinyl.imageUrl)
    setGenre(vinyl.genre)
    setSuggestions([])
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setArtist(query)
    
    if (query.length > 2) {
      try {
        const res = await fetch(`/api/discogs-suggest?query=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setArtist(suggestion.artist)
    setTitle(suggestion.title)
    setGenre(suggestion.genre)
    setSuggestions([])
  }

  const fetchAlbumData = async () => {
    if (!artist || !title) {
      setError('Please enter both artist and title to fetch album data.')
      return
    }
    
    try {
      setError(null)
      const res = await fetch(`/api/discogs?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`)
      
      if (res.ok) {
        const data = await res.json()
        if (data.year) setYear(data.year.toString())
        if (data.imageUrl) setImageUrl(data.imageUrl)
        if (data.genre) setGenre(data.genre)
      } else {
        throw new Error('Album not found on Discogs')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const filteredCollection = collection.filter((vinyl) => {
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
              <p style={{ color: '#f38ba8' }}>{error}</p>
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
        {userProfile && (
          <div className="window">
            <div className="title-bar">Welcome, {userProfile.username}!</div>
            <div className={styles.contentSection}>
              <p>Total Records: {userProfile.totalRecords}</p>
              <p>Top Genres:</p>
              <ul>
                {Object.entries(userProfile.genreStats)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .slice(0, 3)
                  .map(([genre, count]) => (
                    <li key={genre}>{genre}: {count}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        <div className="window">
          <div className="title-bar">{editingVinyl ? 'Edit Vinyl' : 'Add New Vinyl'}</div>
          <div className={styles.contentSection}>
            <form onSubmit={addOrUpdateVinyl} className={styles.form}>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  placeholder="Artist"
                  value={artist}
                  onChange={handleSearchChange}
                  required
                />
                {suggestions.length > 0 && (
                  <ul className={styles.suggestionsList}>
                    {suggestions.map((s, index) => (
                      <li key={index} onClick={() => handleSuggestionClick(s)}>
                        {s.artist} - {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={fetchAlbumData}
                style={{ gridColumn: '1 / -1', marginBottom: '10px' }}
              >
                Fetch Album Data
              </button>
              <input
                type="number"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Genre (comma-separated)"
                value={genre.join(', ')}
                onChange={(e) => setGenre(e.target.value.split(',').map(g => g.trim()).filter(g => g))}
                required
              />
              <input
                type="text"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={styles.fullWidthInput}
              />
              <div className={styles.formActions}>
                <button type="submit">{editingVinyl ? 'Update Vinyl' : 'Add Vinyl'}</button>
                {editingVinyl && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingVinyl(null)
                      setArtist('')
                      setTitle('')
                      setYear('')
                      setImageUrl('')
                      setGenre([])
                      setSuggestions([])
                    }} 
                    style={{ marginLeft: '10px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="window">
          <div className="title-bar">My Vinyl Collection</div>
          <div className={styles.contentSection}>
            <h1>My Vinyl Collection</h1>

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
                <option value={collection.length}>Show All</option>
              </select>
            </div>

            <div className={styles.collectionGrid}>
              {filteredCollection.map((vinyl) => (
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
                  <div className={styles.buttonGroup}>
                    <button onClick={(e) => { e.preventDefault(); startEditing(vinyl); }}>Edit</button>
                    <button className="delete-btn" onClick={(e) => { e.preventDefault(); deleteVinyl(vinyl.id); }}>Delete</button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}