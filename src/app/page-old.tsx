'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import SearchAndFilter, { FilterState } from './components/SearchAndFilter'
import LoadingSpinner from './components/LoadingSpinner'
import { ErrorBoundary, ErrorDisplay, useErrorHandler } from './components/ErrorBoundary'
import { useFormValidation, commonValidationRules } from './hooks/useFormValidation'

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
  discogsUsername?: string
  discogsAvatarUrl?: string
  totalDiscogsItems?: number
  discogsReleases?: Vinyl[]
}

export default function Home() {
  const [allCollection, setAllCollection] = useState<Vinyl[]>([])
  const [filteredCollection, setFilteredCollection] = useState<Vinyl[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { error, resetError, handleError } = useErrorHandler()

  // Form validation
  const formValidation = useFormValidation(
    {
      artist: '',
      title: '',
      year: '',
      imageUrl: '',
      genre: ''
    },
    {
      artist: commonValidationRules.required,
      title: commonValidationRules.required,
      year: { ...commonValidationRules.required, ...commonValidationRules.year },
      genre: commonValidationRules.required
    }
  )

  const router = useRouter()

  const fetchCollection = useCallback(async (filters?: FilterState) => {
    try {
      setLoading(true)
      resetError()
      
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
      const sortedData = sortCollection(collectionData, filters?.sortBy || 'newest')
      const limitedData = sortedData.slice(0, filters?.displayLimit || 12)
      
      setFilteredCollection(limitedData)
      if (!filters || (!filters.search && !filters.artist && !filters.title && !filters.genre && !filters.year && !filters.yearFrom && !filters.yearTo)) {
        setAllCollection(collectionData)
      }
    } catch (error) {
      handleError(error as Error)
    } finally {
      setLoading(false)
    }
  }, [router]) // Remove handleError and resetError from dependencies

  const fetchUserProfile = useCallback(async () => {
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
      handleError(error as Error)
    }
  }, [router]) // Remove handleError from dependencies

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

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile()
      await fetchCollection()
      setHasInitialized(true)
    }
    initializeData()
  }, [])

  const handleFiltersChange = useCallback((filters: FilterState) => {
    if (hasInitialized) {
      fetchCollection(filters)
    }
  }, [hasInitialized])

  useEffect(() => {
    setHasInitialized(true)
  }, [])

  const addOrUpdateVinyl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formValidation.validateAll()) {
      return
    }

    try {
      setFormLoading(true)
      resetError()
      
      const genreArray = typeof formValidation.values.genre === 'string' 
        ? formValidation.values.genre.split(',').map(g => g.trim()).filter(g => g)
        : formValidation.values.genre
      
      const vinylData = {
        artist: formValidation.values.artist,
        title: formValidation.values.title,
        year: parseInt(formValidation.values.year),
        imageUrl: formValidation.values.imageUrl,
        genre: genreArray,
        discogsId: editingVinyl?.discogsId || null
      }

      if (editingVinyl) {
        const res = await fetch(`/api/collection/${editingVinyl.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        
        if (!res.ok) {
          throw new Error('Failed to update vinyl')
        }
      } else {
        const res = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinylData),
        })
        
        if (!res.ok) {
          throw new Error('Failed to add vinyl')
        }
      }

      // Reset form and refresh data
      formValidation.reset()
      setEditingVinyl(null)
      setSuggestions([])
      await fetchCollection()
      await fetchUserProfile()
    } catch (error) {
      handleError(error as Error)
    } finally {
      setFormLoading(false)
    }
  }

  const deleteVinyl = async (id: number) => {
    try {
      resetError()
      const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        throw new Error('Failed to delete vinyl')
      }
      
      await fetchCollection()
      await fetchUserProfile()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const startEditing = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl)
    formValidation.setValues({
      artist: vinyl.artist,
      title: vinyl.title,
      year: vinyl.year.toString(),
      imageUrl: vinyl.imageUrl,
      genre: vinyl.genre.join(', ')
    })
    setSuggestions([])
  }

  const fetchAlbumData = async () => {
    if (!formValidation.values.artist || !formValidation.values.title) {
      handleError(new Error('Please enter both artist and title to fetch album data.'))
      return
    }
    
    try {
      setFormLoading(true)
      resetError()
      
      const res = await fetch(`/api/discogs?artist=${encodeURIComponent(formValidation.values.artist)}&title=${encodeURIComponent(formValidation.values.title)}`)
      
      if (res.ok) {
        const data = await res.json()
        formValidation.setValues(prev => ({
          ...prev,
          year: data.year ? data.year.toString() : prev.year,
          imageUrl: data.imageUrl || prev.imageUrl,
          genre: data.genre ? data.genre.join(', ') : prev.genre
        }))
        
        if (editingVinyl) {
          setEditingVinyl(prev => prev ? { ...prev, discogsId: data.discogsId || prev.discogsId } : null)
        }
      } else {
        throw new Error('Album not found on Discogs')
      }
    } catch (error) {
      handleError(error as Error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    formValidation.handleChange('artist', query)
    
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
    formValidation.setValues(prev => ({
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
            resetError()
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
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#a6adc8' }}>
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
                    value={formValidation.values.artist}
                    onChange={handleSearchChange}
                    onBlur={() => formValidation.handleBlur('artist')}
                    className={!formValidation.isFieldValid('artist') && formValidation.touched.artist ? styles.inputError : ''}
                  />
                  {formValidation.errors.artist && formValidation.touched.artist && (
                    <span className={styles.errorText}>{formValidation.errors.artist}</span>
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
                    value={formValidation.values.title}
                    onChange={(e) => formValidation.handleChange('title', e.target.value)}
                    onBlur={() => formValidation.handleBlur('title')}
                    className={!formValidation.isFieldValid('title') && formValidation.touched.title ? styles.inputError : ''}
                  />
                  {formValidation.errors.title && formValidation.touched.title && (
                    <span className={styles.errorText}>{formValidation.errors.title}</span>
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
                    value={formValidation.values.year}
                    onChange={(e) => formValidation.handleChange('year', e.target.value)}
                    onBlur={() => formValidation.handleBlur('year')}
                    className={!formValidation.isFieldValid('year') && formValidation.touched.year ? styles.inputError : ''}
                  />
                  {formValidation.errors.year && formValidation.touched.year && (
                    <span className={styles.errorText}>{formValidation.errors.year}</span>
                  )}
                </div>
                
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Genre (comma-separated)"
                    value={formValidation.values.genre}
                    onChange={(e) => formValidation.handleChange('genre', e.target.value)}
                    onBlur={() => formValidation.handleBlur('genre')}
                    className={!formValidation.isFieldValid('genre') && formValidation.touched.genre ? styles.inputError : ''}
                  />
                  {formValidation.errors.genre && formValidation.touched.genre && (
                    <span className={styles.errorText}>{formValidation.errors.genre}</span>
                  )}
                </div>
                
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={formValidation.values.imageUrl}
                    onChange={(e) => formValidation.handleChange('imageUrl', e.target.value)}
                    className={styles.fullWidthInput}
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button type="submit" disabled={formLoading || formValidation.hasErrors}>
                    {formLoading ? 'Saving...' : editingVinyl ? 'Update Vinyl' : 'Add Vinyl'}
                  </button>
                  {editingVinyl && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingVinyl(null)
                        formValidation.reset()
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
        </div>
      </main>
    </ErrorBoundary>
  )
}



