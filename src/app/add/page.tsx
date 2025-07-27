'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import styles from '../page.module.css'

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
  purchaseCurrency?: string
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

interface Suggestion {
  artist: string
  title: string
  genre: string[]
  style: string[]
  year: number | null
  format: string[]
  label: string[]
  thumb: string | null
  country: string | null
  catno: string | null
}

interface UserProfile {
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
}

export default function AddVinyl() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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
  
  // New manual fields state
  const [trackList, setTrackList] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [label, setLabel] = useState('')
  const [format, setFormat] = useState('')
  const [condition, setCondition] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(undefined)
  const [purchaseCurrency, setPurchaseCurrency] = useState('USD')
  const [purchaseLocation, setPurchaseLocation] = useState('')
  const [catalogNumber, setCatalogNumber] = useState('')
  const [country, setCountry] = useState('')
  
  // Search and form states
  const [searchMode, setSearchMode] = useState(true)
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
        // Fetch user profile with caching
        const userData = await apiClient.getCurrentUser()
        setUserProfile(userData)

        // Fetch collections with caching
        const collectionsData = await apiClient.getCollections()
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
      const filters: Record<string, string> = {}
      if (collectionFilter && collectionFilter !== 'all') {
        filters.collectionId = collectionFilter
      }
      
      const vinylsData = await apiClient.getVinylCollection(filters)
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

  const addVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!artist || !title) {
      setError('Please fill in Artist and Title fields')
      return
    }
    
    // Clear any previous errors if we have the minimum required fields
    if (artist && title) {
      setError(null)
    }

    try {
      setError(null)
      setSuccessMessage(null)
      const vinylData = { 
        artist, 
        title, 
        year: year ? parseInt(year) : null, 
        imageUrl, 
        genre,
        discogsId,
        collectionId: selectedCollectionId,
        // Manual fields
        trackList,
        description,
        label,
        format,
        condition,
        rating,
        purchaseDate: purchaseDate || null,
        purchasePrice: purchasePrice || null,
        purchaseCurrency,
        purchaseLocation,
        catalogNumber,
        country
      }

      await apiClient.addVinyl(vinylData)
      setSuccessMessage(`✅ "${title}" by ${artist} added to your collection!`)

      // Reset form but keep current search mode
      const currentSearchMode = searchMode
      setArtist('')
      setTitle('')
      setYear('')
      setImageUrl('')
      setGenre([])
      setDiscogsId(undefined)
      setSuggestions([])
      setSearchQuery('')
      setDataFetched(false)
      
      // Reset manual fields
      setTrackList([])
      setDescription('')
      setLabel('')
      setFormat('')
      setCondition('')
      setRating(undefined)
      setPurchaseDate('')
      setPurchasePrice(undefined)
      setPurchaseCurrency('USD')
      setPurchaseLocation('')
      setCatalogNumber('')
      setCountry('')
      
      // Keep the user in their preferred mode
      setSearchMode(currentSearchMode)
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 4000)
      
      // Refresh vinyls and user data with cache invalidation
      const [vinylsData, userData] = await Promise.all([
        apiClient.getVinylCollection({}, { cache: 'force-refresh' }),
        apiClient.getCurrentUser({ cache: 'force-refresh' })
      ])
      
      setVinyls(vinylsData)
      setUserProfile(userData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const deleteVinyl = async (id: number) => {
    try {
      setError(null)
      await apiClient.deleteVinyl(id.toString())
      
      // Refresh data with cache invalidation
      const [vinylsData, userData] = await Promise.all([
        apiClient.getVinylCollection({}, { cache: 'force-refresh' }),
        apiClient.getCurrentUser({ cache: 'force-refresh' })
      ])
      
      setVinyls(vinylsData)
      setUserProfile(userData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }


  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.length > 2) {
      setIsSearching(true)
      try {
        const data = await apiClient.searchDiscogs(query)
        setSuggestions(data)
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
        // Reset manual fields
        setTrackList([])
        setDescription('')
        setLabel('')
        setFormat('')
        setCondition('')
        setRating(undefined)
        setPurchaseDate('')
        setPurchasePrice(undefined)
        setPurchaseCurrency('USD')
        setPurchaseLocation('')
        setCatalogNumber('')
        setCountry('')
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
      const data = await apiClient.getDiscogsData(suggestion.artist, suggestion.title)
      
      // Handle potentially missing fields from Discogs
      if (data.year) {
        setYear(data.year.toString())
      } else {
        setYear('') // Clear year if not found
      }
      if (data.imageUrl) setImageUrl(data.imageUrl)
      if (data.genre && data.genre.length > 0) {
        setGenre(data.genre)
      } else {
        setGenre([]) // Clear genres if not found
      }
      if (data.discogsId) setDiscogsId(data.discogsId)
      setDataFetched(true)
      
      // Show info about missing fields
      const missingFields = []
      if (!data.year) missingFields.push('year')
      if (!data.genre || data.genre.length === 0) missingFields.push('genre')
      
      if (missingFields.length > 0) {
        setError(`ℹ️ Note: ${missingFields.join(', ')} not found in Discogs - you can add these manually if needed`)
        // Clear error after 5 seconds since this is just informational
        setTimeout(() => {
          setError(null)
        }, 5000)
      } else {
        setError(null) // Clear any previous errors
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
      // Reset manual fields
      setTrackList([])
      setDescription('')
      setLabel('')
      setFormat('')
      setCondition('')
      setRating(undefined)
      setPurchaseDate('')
      setPurchasePrice(undefined)
      setPurchaseCurrency('USD')
      setPurchaseLocation('')
      setCatalogNumber('')
      setCountry('')
    }
  }

  const handleManualEntry = () => {
    setSearchMode(false)
    setSuggestions([])
    setSearchQuery('')
    setDataFetched(false)
    // Reset manual fields
    setTrackList([])
    setDescription('')
    setLabel('')
    setFormat('')
    setCondition('')
    setRating(undefined)
    setPurchaseDate('')
    setPurchasePrice(undefined)
    setPurchaseCurrency('USD')
    setPurchaseLocation('')
    setCatalogNumber('')
    setCountry('')
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
          <div className="title-bar">Add Vinyl to Collection</div>
          <div className={styles.contentSection}>
            <div className={styles.browseIntro}>
              <h2>Add Music to Your Collection</h2>
              <p>
                Search our database or manually enter vinyl details. For the best experience, try <Link href="/browse" className={styles.helpLink}>Discover Music →</Link> to browse millions of releases.
              </p>
              <div className={styles.browseActions}>
                <Link href="/browse" className={styles.addButton}>
                  🌍 Discover & Add
                </Link>
                <Link href="/collections" className={styles.manageButton}>
                  📚 Manage Collections
                </Link>
              </div>
            </div>
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

            <form onSubmit={addVinyl} className={styles.form}>

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
                            <div className={styles.suggestionContent}>
                              {s.thumb && (
                                <img 
                                  src={`/api/image-proxy?url=${encodeURIComponent(s.thumb)}`}
                                  alt={`${s.title} cover`}
                                  className={styles.suggestionThumb}
                                />
                              )}
                              <div className={styles.suggestionInfo}>
                                <div className={styles.suggestionMain}>
                                  <strong>{s.artist}</strong> - {s.title}
                                </div>
                                <div className={styles.suggestionMeta}>
                                  {s.year && <span>{s.year}</span>}
                                  {s.country && <span> • {s.country}</span>}
                                  {s.format.length > 0 && <span> • {s.format[0]}</span>}
                                  {s.label.length > 0 && <span> • {s.label[0]}</span>}
                                </div>
                                <div className={styles.suggestionGenres}>
                                  {s.genre.length > 0 && s.genre.slice(0, 2).join(', ')}
                                  {s.style.length > 0 && ` • ${s.style.slice(0, 2).join(', ')}`}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Show fetched data */}
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
              ) : (
                /* Manual Entry Mode */
                <div className={styles.manualContainer}>
                  <div className={styles.requiredFieldsNote}>
                    <small>* Required fields: Artist and Title only</small>
                  </div>
                  <input
                    type="text"
                    placeholder="Artist *"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Year (optional)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Genre (comma-separated, optional)"
                    value={genre.join(', ')}
                    onChange={(e) => setGenre(e.target.value.split(',').map(g => g.trim()).filter(g => g))}
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
                <button type="submit">Add Vinyl</button>
              </div>
            </form>
          </div>
        </div>

        <div className="window">
          <div className="title-bar">Quick Actions</div>
          <div className={styles.contentSection}>
            <div className={styles.browseIntro}>
              <h2>What's next?</h2>
              <p>After adding your vinyl, you might want to organize it or view your collection.</p>
              <div className={styles.browseActions}>
                <Link href="/" className={styles.manageButton}>
                  🎧 My Collection
                </Link>
                <Link href="/browse" className={styles.browseButton}>
                  🌍 Discover Music
                </Link>
                <Link href="/collections" className={styles.statsButton}>
                  📚 Manage Collections
                </Link>
                <Link href="/profile" className={styles.addButton}>
                  📊 View Statistics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}