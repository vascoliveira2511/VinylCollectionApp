'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Vinyl {
  id: number
  artist: string
  title: string
  year: number
  imageUrl: string
  genre: string[]
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
  discogsUsername?: string
  discogsAvatarUrl?: string
  totalDiscogsItems?: number
  discogsReleases?: Vinyl[]
}

export default function Home() {
  const [collection, setCollection] = useState<Vinyl[]>([])
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Filter states
  const [filterArtist, setFilterArtist] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const router = useRouter()

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch user profile data
      const userRes = await fetch('/api/auth/user')
      if (!userRes.ok) {
        router.push('/login')
        return
      }
      const userData = await userRes.json()
      setUserProfile(userData)

      // Fetch collection data
      const collectionRes = await fetch('/api/collection')
      if (!collectionRes.ok) {
        router.push('/login')
        return
      }
      const collectionData = await collectionRes.json()
      setCollection(collectionData)
    }

    fetchInitialData()
  }, [router])

  const addOrUpdateVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    const vinylData = { artist, title, year: parseInt(year), imageUrl, genre }
    let updatedCollection

    if (editingVinyl) {
      const res = await fetch(`/api/collection/${editingVinyl.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vinylData),
        }
      )
      const updatedVinyl = await res.json()
      updatedCollection = collection.map((v) =>
        v.id === updatedVinyl.id ? updatedVinyl : v
      )
    } else {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vinylData),
      })
      updatedCollection = await res.json()
    }

    setCollection(updatedCollection)
    setArtist('')
    setTitle('')
    setYear('')
    setImageUrl('')
    setGenre([])
    setEditingVinyl(null)

    // Re-fetch user profile data to update stats on home page
    const userRes = await fetch('/api/auth/user')
    if (userRes.ok) {
      const userData = await userRes.json()
      setUserProfile(userData)
    }
  }

  const deleteVinyl = async (id: number) => {
    await fetch(`/api/collection/${id}`, { method: 'DELETE' })
    setCollection(collection.filter((v) => v.id !== id))

    // Re-fetch user profile data to update stats on home page
    const userRes = await fetch('/api/auth/user')
    if (userRes.ok) {
      const userData = await userRes.json()
      setUserProfile(userData)
    }
  }

  const startEditing = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl)
    setArtist(vinyl.artist)
    setTitle(vinyl.title)
    setYear(vinyl.year.toString())
    setImageUrl(vinyl.imageUrl)
    setGenre(vinyl.genre)
  }

  const fetchAlbumData = async () => {
    if (!artist || !title) {
      alert('Please enter both artist and title to fetch album data.')
      return
    }
    try {
      console.log('Frontend: Fetching album data for', artist, title)
      const res = await fetch(`/api/discogs?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Frontend: Received album data', data)
        setYear(data.year ? data.year.toString() : '')
        setImageUrl(data.imageUrl || '')
        setGenre(data.genre || [])
      } else {
        const errorData = await res.json()
        console.error('Frontend: Album not found error', errorData)
        alert('Album not found on Discogs.')
      }
    } catch (error) {
      console.error('Frontend: Error fetching album data:', error)
      alert('Failed to fetch album data.')
    }
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setArtist(query)
    if (query.length > 2) {
      try {
        console.log('Frontend: Fetching suggestions for', query)
        const res = await fetch(`/api/discogs-suggest?query=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          console.log('Frontend: Received suggestions', data)
          setSuggestions(data)
        } else {
          const errorData = await res.json()
          console.error('Frontend: Suggestions error', errorData)
          setSuggestions([])
        }
      } catch (error) {
        console.error('Frontend: Error fetching suggestions:', error)
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setArtist(suggestion.artist)
    setTitle(suggestion.title)
    setSuggestions([])
  }

  const filteredCollection = collection.filter((vinyl) => {
    const matchesArtist = filterArtist === '' || vinyl.artist.toLowerCase().includes(filterArtist.toLowerCase())
    const matchesTitle = filterTitle === '' || vinyl.title.toLowerCase().includes(filterTitle.toLowerCase())
    const matchesGenre = filterGenre === '' || vinyl.genre.some(g => g.toLowerCase().includes(filterGenre.toLowerCase()))
    const matchesYear = filterYear === '' || vinyl.year.toString().includes(filterYear)
    return matchesArtist && matchesTitle && matchesGenre && matchesYear
  })

  return (
    <main className={styles.main}>
      <div className="container">
        {userProfile && (
          <div className="window">
            <div className="title-bar">Welcome, {userProfile.username}!</div>
            <div className={styles.contentSection}>
              {userProfile.discogsAvatarUrl && (
                <img src={userProfile.discogsAvatarUrl} alt="Discogs Avatar" className={styles.discogsAvatar} />
              )}
              <p>Total Records: {userProfile.totalRecords}</p>
              <p>Top Genres:</p>
              <ul>
                {Object.entries(userProfile.genreStats)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .slice(0, 3) // Show top 3 genres
                  .map(([genre, count]) => (
                    <li key={genre}>{genre}: {count}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}

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
            </div>

            <div className={styles.collectionGrid}>
              {filteredCollection.map((vinyl) => (
                <div key={vinyl.id} className={styles.card}>
                  <img src={vinyl.imageUrl || 'https://via.placeholder.com/150'} alt={`${vinyl.title} cover`} className={styles.albumArt} />
                  <h3>{vinyl.title}</h3>
                  <p>{vinyl.artist}</p>
                  <p>{vinyl.year}</p>
                  <div className={styles.genrePills}>
                    {vinyl.genre.map((g, idx) => (
                      <span key={idx} className={styles.genrePill}>{g}</span>
                    ))}
                  </div>
                  <div className={styles.buttonGroup}>
                    <button onClick={() => startEditing(vinyl)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteVinyl(vinyl.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
              <button type="button" onClick={fetchAlbumData} style={{ gridColumn: '1 / -1' }}>Fetch Album Data</button>
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
                  <button type="button" onClick={() => setEditingVinyl(null)} style={{ marginLeft: '10px' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}



