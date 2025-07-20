'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import SearchAndFilter, { FilterState } from './components/SearchAndFilter'
import LoadingSpinner from './components/LoadingSpinner'
import { ErrorBoundary, ErrorDisplay } from './components/ErrorBoundary'

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
  const [allCollection, setAllCollection] = useState<Vinyl[]>([])
  const [filteredCollection, setFilteredCollection] = useState<Vinyl[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    artist: '',
    title: '',
    year: '',
    imageUrl: '',
    genre: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const initialized = useRef(false)

  // Simple data fetching functions
  const fetchUserProfile = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError(error as Error)
    }
  }

  const fetchCollection = async (filters?: FilterState) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.artist) params.append('artist', filters.artist)
      if (filters?.title) params.append('title', filters.title)
      if (filters?.genre) params.append('genre', filters.genre)
      if (filters?.year) params.append('year', filters.year)
      if (filters?.yearFrom) params.append('yearFrom', filters.yearFrom)
      if (filters?.yearTo) params.append('yearTo', filters.yearTo)

      const collectionRes = await fetch(`/api/collection?${params.toString()}`)
      if (!collectionRes.ok) {
        if (collectionRes.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch collection')
      }
      
      const collectionData = await collectionRes.json()
      
      // Apply sorting
      const sortedData = sortCollection(collectionData, filters?.sortBy || 'newest')
      
      // Apply display limit
      const limitedData = filters?.displayLimit 
        ? sortedData.slice(0, filters.displayLimit)
        : sortedData

      setFilteredCollection(limitedData)
      
      // Only update allCollection if this is the initial load
      if (!filters || isDefaultFilters(filters)) {
        setAllCollection(collectionData)
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const isDefaultFilters = (filters: FilterState) => {
    return !filters.search && !filters.artist && !filters.title && 
           !filters.genre && !filters.year && !filters.yearFrom && !filters.yearTo
  }

  const sortCollection = (collection: Vinyl[], sortBy: FilterState['sortBy']) => {
    switch (sortBy) {
      case 'oldest':
        return [...collection].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      case 'artist':
        return [...collection].sort((a, b) => a.artist.localeCompare(b.artist))
      case 'title':
        return [...collection].sort((a, b) => a.title.localeCompare(b.title))
      case 'year':
        return [...collection].sort((a, b) => (b.year || 0) - (a.year || 0))
      case 'newest':
      default:
        return [...collection].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }
  }

  // Initialize data on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      const initializeData = async () => {
        await fetchUserProfile()
        await fetchCollection()
      }
      initializeData()
    }
  }, [])

  // Handle filter changes with debouncing
  const handleFiltersChange = (filters: FilterState) => {
    // Only fetch if we're initialized
    if (initialized.current) {
      const timeoutId = setTimeout(() => {
        fetchCollection(filters)
      }, 300)
      
      // Store timeout to clear it if needed
      return () => clearTimeout(timeoutId)
    }
  }

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.artist.trim()) errors.artist = 'Artist is required'
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.year.trim()) errors.year = 'Year is required'
    else {
      const year = parseInt(formData.year)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) {
        errors.year = 'Please enter a valid year'
      }
    }
    if (!formData.genre.trim()) errors.genre = 'Genre is required'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addOrUpdateVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setFormLoading(true)
      setError(null)
      
      const genreArray = formData.genre.split(',').map(g => g.trim()).filter(g => g)
      
      const vinylData = {
        artist: formData.artist,
        title: formData.title,
        year: parseInt(formData.year),
        imageUrl: formData.imageUrl,
        genre: genreArray,
        discogsId: editingVinyl?.discogsId || null
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

      // Reset form and refresh data
      setFormData({ artist: '', title: '', year: '', imageUrl: '', genre: '' })
      setEditingVinyl(null)
      setSuggestions([])
      setFormErrors({})
      
      await fetchCollection()
      await fetchUserProfile()
    } catch (error) {
      setError(error as Error)
    } finally {
      setFormLoading(false)
    }
  }

  const deleteVinyl = async (id: number) => {
    try {
      setError(null)
      const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' })
      
      if (!res.ok) throw new Error('Failed to delete vinyl')
      
      await fetchCollection()
      await fetchUserProfile()
    } catch (error) {
      setError(error as Error)
    }
  }

  const startEditing = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl)
    setFormData({
      artist: vinyl.artist,
      title: vinyl.title,
      year: vinyl.year.toString(),
      imageUrl: vinyl.imageUrl,
      genre: vinyl.genre.join(', ')
    })
    setSuggestions([])
    setFormErrors({})
  }

  const fetchAlbumData = async () => {
    if (!formData.artist || !formData.title) {
      setError(new Error('Please enter both artist and title to fetch album data.'))
      return
    }
    
    try {
      setFormLoading(true)
      setError(null)
      
      const res = await fetch(`/api/discogs?artist=${encodeURIComponent(formData.artist)}&title=${encodeURIComponent(formData.title)}`)
      
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          year: data.year ? data.year.toString() : prev.year,
          imageUrl: data.imageUrl || prev.imageUrl,
          genre: data.genre ? data.genre.join(', ') : prev.genre
        }))
        
        if (editingVinyl && data.discogsId) {
          setEditingVinyl(prev => prev ? { ...prev, discogsId: data.discogsId } : null)
        }
      } else {
        throw new Error('Album not found on Discogs')
      }
    } catch (error) {
      setError(error as Error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setFormData(prev => ({ ...prev, artist: query }))
    
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
    setFormData(prev => ({
      ...prev,
      artist: suggestion.artist,
      title: suggestion.title,
      genre: suggestion.genre.join(', ')
    }))
    setSuggestions([])
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className="container">
          <ErrorDisplay error={error} onRetry={() => {
            setError(null)
            fetchCollection()
            fetchUserProfile()
          }} />
        </div>
      </main>
    )
  }

  return (
    <ErrorBoundary>
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
            <div className="title-bar">My Vinyl Collection</div>
            <div className={styles.contentSection}>
              <h1>My Vinyl Collection</h1>

              <SearchAndFilter 
                onFiltersChange={handleFiltersChange}
                totalResults={filteredCollection.length}
                collection={allCollection}
              />

              {loading ? (
                <LoadingSpinner text="Loading your collection..." />
              ) : (
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
                  {filteredCollection.length === 0 && !loading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--ctp-subtext0)' }}>
                      No vinyl records found matching your filters.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="window">
            <div className="title-bar">{editingVinyl ? 'Edit Vinyl' : 'Add New Vinyl'}</div>
            <div className={styles.contentSection}>
              {formLoading && <LoadingSpinner size="small" text="Processing..." />}
              
              <form onSubmit={addOrUpdateVinyl} className={styles.form}>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Artist"
                    value={formData.artist}
                    onChange={handleSearchChange}
                    className={formErrors.artist ? styles.inputError : ''}
                  />
                  {formErrors.artist && (
                    <span className={styles.errorText}>{formErrors.artist}</span>
                  )}
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
                
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={formErrors.title ? styles.inputError : ''}
                  />
                  {formErrors.title && (
                    <span className={styles.errorText}>{formErrors.title}</span>
                  )}
                </div>
                
                <button 
                  type="button" 
                  onClick={fetchAlbumData} 
                  disabled={formLoading}
                  style={{ gridColumn: '1 / -1' }}
                >
                  {formLoading ? 'Fetching...' : 'Fetch Album Data'}
                </button>
                
                <div className={styles.inputContainer}>
                  <input
                    type="number"
                    placeholder="Year"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className={formErrors.year ? styles.inputError : ''}
                  />
                  {formErrors.year && (
                    <span className={styles.errorText}>{formErrors.year}</span>
                  )}
                </div>
                
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Genre (comma-separated)"
                    value={formData.genre}
                    onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className={formErrors.genre ? styles.inputError : ''}
                  />
                  {formErrors.genre && (
                    <span className={styles.errorText}>{formErrors.genre}</span>
                  )}
                </div>
                
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className={styles.fullWidthInput}
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button type="submit" disabled={formLoading}>
                    {formLoading ? 'Saving...' : editingVinyl ? 'Update Vinyl' : 'Add Vinyl'}
                  </button>
                  {editingVinyl && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingVinyl(null)
                        setFormData({ artist: '', title: '', year: '', imageUrl: '', genre: '' })
                        setSuggestions([])
                        setFormErrors({})
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
        </div>
      </main>
    </ErrorBoundary>
  )
}