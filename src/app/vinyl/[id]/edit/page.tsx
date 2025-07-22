'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../../page.module.css'

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
  isDefault: boolean
  _count: {
    vinyls: number
  }
}

export default function EditVinylPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  
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
  
  // Other state
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vinyl details
        const vinylRes = await fetch(`/api/collection/${id}`)
        if (!vinylRes.ok) {
          if (vinylRes.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch vinyl details')
        }
        const vinyl: Vinyl = await vinylRes.json()
        
        // Populate form with vinyl data
        setArtist(vinyl.artist)
        setTitle(vinyl.title)
        setYear(vinyl.year.toString())
        setImageUrl(vinyl.imageUrl)
        setGenre(vinyl.genre)
        setDiscogsId(vinyl.discogsId)
        setSelectedCollectionId(vinyl.collection?.id)
        
        // Set manual fields
        setTrackList(vinyl.trackList || [])
        setDescription(vinyl.description || '')
        setLabel(vinyl.label || '')
        setFormat(vinyl.format || '')
        setCondition(vinyl.condition || '')
        setRating(vinyl.rating)
        setPurchaseDate(vinyl.purchaseDate || '')
        setPurchasePrice(vinyl.purchasePrice)
        setPurchaseCurrency(vinyl.purchaseCurrency || 'USD')
        setPurchaseLocation(vinyl.purchaseLocation || '')
        setCatalogNumber(vinyl.catalogNumber || '')
        setCountry(vinyl.country || '')
        
        // Fetch collections
        const collectionsRes = await fetch('/api/collections')
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json()
          setCollections(collectionsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!artist || !title || !year) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const vinylData = {
        artist,
        title,
        year: parseInt(year),
        imageUrl,
        genre,
        discogsId,
        collectionId: selectedCollectionId,
        // New manual fields
        trackList: trackList,
        description: description || null,
        label: label || null,
        format: format || null,
        condition: condition || null,
        rating: rating || null,
        purchaseDate: purchaseDate || null,
        purchasePrice: purchasePrice || null,
        purchaseCurrency: purchaseCurrency || null,
        purchaseLocation: purchaseLocation || null,
        catalogNumber: catalogNumber || null,
        country: country || null
      }

      const res = await fetch(`/api/collection/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vinylData),
      })

      if (!res.ok) throw new Error('Failed to update vinyl')
      
      setSuccessMessage(`✅ "${title}" by ${artist} updated successfully!`)
      
      // Redirect back to vinyl details after 2 seconds
      setTimeout(() => {
        router.push(`/vinyl/${id}`)
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading vinyl details...</p>
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
          <div className="title-bar">✏️ Edit Vinyl Record</div>
          <div className={styles.contentSection}>
            
            {/* Error/Success Messages */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Basic Information Section */}
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">Basic Information</div>
                <div className={styles.contentSection}>
                  <div className={styles.editFormGrid}>
                    <input
                      type="text"
                      placeholder="Artist *"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Album Title *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Year *"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Genre (comma-separated) *"
                      value={genre.join(', ')}
                      onChange={(e) => setGenre(e.target.value.split(',').map(g => g.trim()).filter(g => g))}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cover Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={styles.fullWidthInput}
                    style={{ marginTop: '10px' }}
                  />
                </div>
              </div>

              {/* Physical Details Section */}
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">Physical Details</div>
                <div className={styles.contentSection}>
                  <div className={styles.editFormGrid}>
                    <input
                      type="text"
                      placeholder="Record Label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Format (LP, EP, 12&quot;)"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                    />
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="">Condition</option>
                      <option value="Mint (M)">Mint (M)</option>
                      <option value="Near Mint (NM)">Near Mint (NM)</option>
                      <option value="Very Good Plus (VG+)">Very Good Plus (VG+)</option>
                      <option value="Very Good (VG)">Very Good (VG)</option>
                      <option value="Good Plus (G+)">Good Plus (G+)</option>
                      <option value="Good (G)">Good (G)</option>
                      <option value="Fair (F)">Fair (F)</option>
                      <option value="Poor (P)">Poor (P)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Catalog Number"
                      value={catalogNumber}
                      onChange={(e) => setCatalogNumber(e.target.value)}
                    />
                    <select
                      value={rating || ''}
                      onChange={(e) => setRating(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Personal Rating</option>
                      <option value="1">⭐ 1 star</option>
                      <option value="2">⭐⭐ 2 stars</option>
                      <option value="3">⭐⭐⭐ 3 stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 stars</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Purchase Information Section */}
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">Purchase Information</div>
                <div className={styles.contentSection}>
                  <div className={styles.editFormGrid}>
                    <input
                      type="date"
                      placeholder="Purchase Date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                    <div className={styles.priceInputGroup}>
                      <select
                        value={purchaseCurrency}
                        onChange={(e) => setPurchaseCurrency(e.target.value)}
                      >
                        <option value="USD">USD $</option>
                        <option value="EUR">EUR €</option>
                        <option value="GBP">GBP £</option>
                        <option value="CAD">CAD $</option>
                        <option value="AUD">AUD $</option>
                        <option value="JPY">JPY ¥</option>
                        <option value="CHF">CHF ₣</option>
                        <option value="SEK">SEK kr</option>
                        <option value="NOK">NOK kr</option>
                        <option value="DKK">DKK kr</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={purchasePrice || ''}
                        onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  <div className={styles.editFormGrid} style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Purchase Location"
                      value={purchaseLocation}
                      onChange={(e) => setPurchaseLocation(e.target.value)}
                    />
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Track List & Notes Section */}
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">Track List & Notes</div>
                <div className={styles.contentSection}>
                  <textarea
                    placeholder="Track List (one track per line)"
                    value={trackList.join('\n')}
                    onChange={(e) => setTrackList(e.target.value.split('\n').filter(t => t.trim()))}
                    rows={6}
                    className={styles.fullWidthInput}
                    style={{ marginBottom: '15px' }}
                  />
                  <textarea
                    placeholder="Personal Notes & Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={styles.fullWidthInput}
                  />
                </div>
              </div>

              {/* Collection Assignment */}
              <div className={styles.collectionSelector}>
                <label htmlFor="collection-select" className={styles.selectorLabel}>
                  📁 Collection:
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
              </div>

              {/* Form Actions */}
              <div className={styles.formActions} style={{ marginTop: '30px' }}>
                <button type="submit" disabled={saving} className={styles.primaryButton}>
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <Link href={`/vinyl/${id}`} className={styles.cancelButton}>
                  ❌ Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}