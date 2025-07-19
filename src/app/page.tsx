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
  const [vinyls, setVinyls] = useState<Vinyl[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
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
  const [discogsId, setDiscogsId] = useState<number | undefined>(undefined)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(undefined)
  
  // Search and form states
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [dataFetched, setDataFetched] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Filter states
  const [filterArtist, setFilterArtist] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterCollection, setFilterCollection] = useState<string>('all')
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
        
        // Set default collection as selected if available
        const defaultCollection = collectionsData.find((c: Collection) => c.isDefault)
        if (defaultCollection) {
          setSelectedCollectionId(defaultCollection.id)
        }

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

  const addOrUpdateVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!artist || !title || !year) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError(null)
      setSuccessMessage(null)
      const vinylData = { 
        artist, 
        title, 
        year: parseInt(year), 
        imageUrl, 
        genre,
        discogsId,
        collectionId: selectedCollectionId 
      }

      if (editingVinyl) {
        const res = await fetch(`/api/collection/${editingVinyl.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        if (!res.ok) throw new Error('Failed to update vinyl')
        setSuccessMessage(`✅ "${title}" by ${artist} updated successfully!`)
      } else {
        const res = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        if (!res.ok) throw new Error('Failed to add vinyl')
        setSuccessMessage(`✅ "${title}" by ${artist} added to your collection!`)
      }

      // Reset form but keep current search mode
      const currentSearchMode = searchMode
      setArtist('')
      setTitle('')
      setYear('')
      setImageUrl('')
      setGenre([])
      setDiscogsId(undefined)
      setEditingVinyl(null)
      setSuggestions([])
      setSearchQuery('')
      setDataFetched(false)
      
      // Keep the user in their preferred mode
      setSearchMode(currentSearchMode)
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 4000)
      
      // Refresh vinyls
      await fetchVinyls(filterCollection)
      
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
    setDiscogsId(vinyl.discogsId)
    setSelectedCollectionId(vinyl.collection?.id)
    setSuggestions([])
    setSearchQuery('')
    setSearchMode(false) // Use manual mode for editing
    setDataFetched(false)
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.length > 2) {
      setIsSearching(true)
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
      } finally {
        setIsSearching(false)
      }
    } else {
      setSuggestions([])
      // Clear form if search is cleared
      if (query === '' && searchMode) {
        setArtist('')
        setTitle('')
        setYear('')
        setImageUrl('')
        setGenre([])
        setDiscogsId(undefined)
        setDataFetched(false)
      }
    }
  }

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setSearchQuery(`${suggestion.artist} - ${suggestion.title}`)
    setArtist(suggestion.artist)
    setTitle(suggestion.title)
    setSuggestions([])
    setIsSearching(true)
    setDataFetched(false)
    
    try {
      setError(null)
      const res = await fetch(`/api/discogs?artist=${encodeURIComponent(suggestion.artist)}&title=${encodeURIComponent(suggestion.title)}`)
      
      if (res.ok) {
        const data = await res.json()
        if (data.year) setYear(data.year.toString())
        if (data.imageUrl) setImageUrl(data.imageUrl)
        if (data.genre) setGenre(data.genre)
        if (data.discogsId) setDiscogsId(data.discogsId)
        setDataFetched(true)
      }
    } catch (error) {
      console.error('Error fetching album data:', error)
      setError('Failed to fetch album data from Discogs')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSearchMode = () => {
    setSearchMode(!searchMode)
    setSearchQuery('')
    setSuggestions([])
    setDataFetched(false)
    // Clear form when switching modes
    if (!searchMode) {
      setArtist('')
      setTitle('')
      setYear('')
      setImageUrl('')
      setGenre([])
      setDiscogsId(undefined)
    }
  }

  const handleManualEntry = () => {
    setSearchMode(false)
    setSuggestions([])
    setSearchQuery('')
    setDataFetched(false)
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

        <div className="window">
          <div className="title-bar">{editingVinyl ? 'Edit Vinyl' : 'Add New Vinyl'}</div>
          <div className={styles.contentSection}>
            {!editingVinyl && (
              <div className={styles.collectionsHelp}>
                <h3>📚 Organize with Collections</h3>
                <p>
                  Create custom collections like "Jazz Classics", "Want List", or "Punk Rock" to organize your vinyls. 
                  <Link href="/collections" className={styles.helpLink}>Manage Collections →</Link>
                </p>
              </div>
            )}
            {/* Search Mode Toggle - Outside form to prevent expansion */}
            <div className={styles.searchModeToggle}>
              <button 
                type="button" 
                onClick={toggleSearchMode}
                className={`${styles.modeButton} ${searchMode ? styles.active : ''}`}
              >
                🔍 Search
              </button>
              <button 
                type="button" 
                onClick={handleManualEntry}
                className={`${styles.modeButton} ${!searchMode ? styles.active : ''}`}
              >
                ✏️ Manual
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            <form onSubmit={addOrUpdateVinyl} className={styles.form}>

              {/* Search Mode */}
              {searchMode ? (
                <div className={styles.searchContainer}>
                  <div className={styles.inputContainer}>
                    <input
                      type="text"
                      placeholder="Search for artist and album... (e.g., 'Miles Davis Kind of Blue')"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className={styles.searchInput}
                    />
                    {isSearching && (
                      <div className={styles.searchingIndicator}>🔍 Searching...</div>
                    )}
                    {suggestions.length > 0 && (
                      <ul className={styles.suggestionsList}>
                        {suggestions.map((s, index) => (
                          <li key={index} onClick={() => handleSuggestionClick(s)} className={styles.suggestionItem}>
                            <div className={styles.suggestionMain}>
                              <strong>{s.artist}</strong> - {s.title}
                            </div>
                            <div className={styles.suggestionMeta}>
                              {s.genre.length > 0 && s.genre.slice(0, 2).join(', ')}
                              {s.style.length > 0 && ` • ${s.style.slice(0, 2).join(', ')}`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Show fetched data */}
                  <div style={{ minHeight: dataFetched ? 'auto' : '0', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    {dataFetched && (
                      <div className={styles.fetchedData}>
                        <h4>✅ Found on Discogs:</h4>
                        <div className={styles.dataPreview}>
                          <div>
                            <p><strong>Artist:</strong> {artist}</p>
                            <p><strong>Title:</strong> {title}</p>
                            <p><strong>Year:</strong> {year}</p>
                            <p><strong>Genre:</strong> {genre.join(', ')}</p>
                          </div>
                          {imageUrl && <img src={imageUrl} alt="Album cover" className={styles.previewImage} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Manual Entry Mode */
                <div className={styles.manualContainer}>
                  <input
                    type="text"
                    placeholder="Artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
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
                </div>
              )}
              <div className={styles.collectionSelector}>
                <label htmlFor="collection-select" className={styles.selectorLabel}>
                  📁 Add to Collection:
                </label>
                <select
                  id="collection-select"
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className={styles.fullWidthInput}
                  required
                >
                  <option value="">Choose a collection...</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title} {collection.isDefault ? '(Default)' : ''} • {collection._count.vinyls} records
                    </option>
                  ))}
                </select>
                <p className={styles.selectorHint}>
                  <Link href="/collections" className={styles.helpLink}>+ Create new collection</Link>
                </p>
              </div>
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
                      setDiscogsId(undefined)
                      setSuggestions([])
                      setSearchQuery('')
                      setSearchMode(false)
                      setDataFetched(false)
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
            <div className={styles.collectionHeader}>
              <h1>My Vinyl Collection</h1>
              <div className={styles.quickActions}>
                <Link href="/collections" className={styles.manageButton}>
                  📚 Manage Collections
                </Link>
              </div>
            </div>

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