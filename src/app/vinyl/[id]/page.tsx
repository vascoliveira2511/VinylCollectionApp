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

export default function VinylDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [vinyl, setVinyl] = useState<Vinyl | null>(null)
  const [discogsDetails, setDiscogsDetails] = useState<any>(null)
  const [showDiscogsTracks, setShowDiscogsTracks] = useState(false)
  const [showUserTracks, setShowUserTracks] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Helper function to format Discogs notes
  const formatDiscogsNotes = (notes: string) => {
    let formattedText = notes
      .replace(/\n/g, '<br/>') // Replace newlines with <br/>
      .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>') // Handle [url=...] links
      .replace(/\[r(\d+)\]/g, '<a href="https://www.discogs.com/release/$1" target="_blank" rel="noopener noreferrer">[r$1]</a>') // Handle [r...] release links
    return { __html: formattedText }
  }

  // Helper function to render rating stars
  const renderRating = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  useEffect(() => {
    const fetchVinylDetails = async () => {
      try {
        const res = await fetch(`/api/collection/${id}`)
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error(`Failed to fetch vinyl details: ${res.statusText}`)
        }
        const data = await res.json()
        setVinyl(data)

        if (data.discogsId) {
          const discogsRes = await fetch(`/api/discogs/release/${data.discogsId}`)
          if (discogsRes.ok) {
            const discogsData = await discogsRes.json()
            setDiscogsDetails(discogsData)
          } else {
            console.error('Failed to fetch Discogs details', discogsRes.statusText)
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchVinylDetails()
    }
  }, [id, router])

  const handleDelete = async () => {
    if (!vinyl) return
    
    if (!confirm(`Are you sure you want to delete "${vinyl.title}" by ${vinyl.artist}? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/collection/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete vinyl')
      
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vinyl')
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading Vinyl Details...</p>
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
            <div className={styles.contentSection}>
              <p>Error: {error}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!vinyl) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Vinyl not found.</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      {/* Background blur effect */}
      {vinyl.imageUrl && (
        <div style={{
          backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(vinyl.imageUrl)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          WebkitFilter: 'blur(20px)',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          opacity: 0.3,
        }}></div>
      )}

      <div className="container">
        <div className="window">
          <div className={styles.contentSection}>
            
            {/* Header with album art and basic info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              <img 
                src={`/api/image-proxy?url=${encodeURIComponent(vinyl.imageUrl)}`} 
                alt={`${vinyl.title} cover`} 
                className={styles.albumArt} 
                style={{ maxWidth: '300px', height: 'auto', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
              />
              <h1 style={{ marginTop: '20px', textAlign: 'center', fontSize: '2em', fontWeight: 'bold', color: 'var(--ctp-text)' }}>
                {vinyl.title}
              </h1>
              <p style={{ textAlign: 'center', fontSize: '1.5em', color: 'var(--ctp-mauve)', margin: '5px 0' }}>
                {vinyl.artist}
              </p>
              <p style={{ textAlign: 'center', fontSize: '1.1em', color: 'var(--ctp-subtext1)' }}>
                {vinyl.year}
              </p>
              
              {/* Genre pills */}
              <div className={styles.genrePills} style={{ marginTop: '15px' }}>
                {vinyl.genre.map((g, idx) => (
                  <span key={idx} className={styles.genrePill}>{g}</span>
                ))}
              </div>

              {/* Rating display */}
              {vinyl.rating && (
                <div style={{ marginTop: '10px', fontSize: '1.2em' }}>
                  {renderRating(vinyl.rating)} ({vinyl.rating}/5)
                </div>
              )}

              {/* Action buttons */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <Link href={`/vinyl/${id}/edit`} className={styles.editButton}>
                  ✏️ Edit
                </Link>
                <button onClick={handleDelete} className={styles.deleteButton}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            {/* User's manual details - only show if there's content */}
            {(vinyl.label || vinyl.format || vinyl.condition || vinyl.country || vinyl.catalogNumber || 
              vinyl.purchaseDate || vinyl.purchasePrice || vinyl.purchaseLocation || vinyl.collection) && (
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">My Details</div>
                <div className={styles.contentSection}>
                  <div className={styles.vinylDetailsGrid}>
                    
                    {vinyl.label && (
                      <p><strong>Label:</strong> <span>{vinyl.label}</span></p>
                    )}
                    
                    {vinyl.format && (
                      <p><strong>Format:</strong> <span>{vinyl.format}</span></p>
                    )}
                    
                    {vinyl.condition && (
                      <p><strong>Condition:</strong> <span>{vinyl.condition}</span></p>
                    )}
                    
                    {vinyl.country && (
                      <p><strong>Country:</strong> <span>{vinyl.country}</span></p>
                    )}
                    
                    {vinyl.catalogNumber && (
                      <p><strong>Catalog #:</strong> <span>{vinyl.catalogNumber}</span></p>
                    )}
                    
                    {vinyl.purchaseDate && (
                      <p><strong>Purchased:</strong> <span>{new Date(vinyl.purchaseDate).toLocaleDateString()}</span></p>
                    )}
                    
                    {vinyl.purchasePrice && (
                      <p><strong>Price:</strong> <span>${vinyl.purchasePrice.toFixed(2)}</span></p>
                    )}
                    
                    {vinyl.purchaseLocation && (
                      <p style={{ gridColumn: 'span 2' }}><strong>Purchased from:</strong> <span>{vinyl.purchaseLocation}</span></p>
                    )}
                    
                    {vinyl.collection && (
                      <p><strong>Collection:</strong> <span>{vinyl.collection.title}</span></p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User's track list */}
            {vinyl.trackList && vinyl.trackList.length > 0 && (
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar" style={{ cursor: 'pointer' }} onClick={() => setShowUserTracks(!showUserTracks)}>
                  My Track List {showUserTracks ? '▲' : '▼'}
                </div>
                {showUserTracks && (
                  <div className={styles.contentSection}>
                    <ol>
                      {vinyl.trackList.map((track, index) => (
                        <li key={index} style={{ marginBottom: '5px' }}>{track}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* User's description */}
            {vinyl.description && (
              <div className="window" style={{ marginBottom: '20px' }}>
                <div className="title-bar">My Notes</div>
                <div className={styles.contentSection}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{vinyl.description}</p>
                </div>
              </div>
            )}

            {/* Discogs details */}
            {discogsDetails && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '30px 0' }} />
                <div className="window">
                  <div className="title-bar">Discogs Information</div>
                  <div className={styles.contentSection}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                      {discogsDetails.labels && discogsDetails.labels.length > 0 && (
                        <p><strong>Label:</strong> {discogsDetails.labels.map((label: any) => label.name).join(', ')}</p>
                      )}
                      {discogsDetails.formats && discogsDetails.formats.length > 0 && (
                        <p><strong>Format:</strong> {discogsDetails.formats.map((format: any) => format.name).join(', ')}</p>
                      )}
                      {discogsDetails.country && (
                        <p><strong>Country:</strong> {discogsDetails.country}</p>
                      )}
                      {discogsDetails.released && (
                        <p><strong>Released:</strong> {discogsDetails.released}</p>
                      )}
                      {discogsDetails.styles && discogsDetails.styles.length > 0 && (
                        <p><strong>Style:</strong> {discogsDetails.styles.join(', ')}</p>
                      )}
                    </div>

                    {discogsDetails.notes && (
                      <div className="window" style={{ marginBottom: '15px' }}>
                        <div className="title-bar" style={{ cursor: 'pointer' }} onClick={() => setShowNotes(!showNotes)}>
                          Discogs Notes {showNotes ? '▲' : '▼'}
                        </div>
                        {showNotes && (
                          <div className={styles.contentSection}>
                            <p dangerouslySetInnerHTML={formatDiscogsNotes(discogsDetails.notes)}></p>
                          </div>
                        )}
                      </div>
                    )}

                    {discogsDetails.tracklist && discogsDetails.tracklist.length > 0 && (
                      <div className="window" style={{ marginBottom: '15px' }}>
                        <div className="title-bar" style={{ cursor: 'pointer' }} onClick={() => setShowDiscogsTracks(!showDiscogsTracks)}>
                          Discogs Tracklist {showDiscogsTracks ? '▲' : '▼'}
                        </div>
                        {showDiscogsTracks && (
                          <div className={styles.contentSection}>
                            <ul>
                              {discogsDetails.tracklist.map((track: any, index: number) => (
                                <li key={index}>{track.position} - {track.title} {track.duration && `(${track.duration})`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {discogsDetails.uri && (
                      <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        <a href={discogsDetails.uri} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                          View on Discogs →
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => router.back()} className={styles.backButton}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}