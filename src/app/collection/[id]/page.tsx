
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLoader from '../../components/PageLoader'
import styles from '../../page.module.css' // Adjust path as needed

interface Vinyl {
  id: number
  artist: string
  title: string
  year: number
  imageUrl: string
  genre: string[]
  discogsId?: number
}

export default function VinylDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [vinyl, setVinyl] = useState<Vinyl | null>(null)
  const [discogsDetails, setDiscogsDetails] = useState<any>(null)
  const [showTracklist, setShowTracklist] = useState(false)
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

  if (loading) {
    return <PageLoader text="Loading vinyl details..." />;
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
      {vinyl.imageUrl && (
        <div style={{
          backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(vinyl.imageUrl)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)', // Increased blur for better effect
          WebkitFilter: 'blur(20px)', // For Safari
          position: 'fixed', // Use fixed to cover viewport
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1, // Ensure it's behind content
          opacity: 0.3, // Subtle opacity
        }}></div>
      )}
      <div className="container">
        <div className="window">
          <div className={styles.contentSection}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <img src={`/api/image-proxy?url=${encodeURIComponent(vinyl.imageUrl)}`} alt={`${vinyl.title} cover`} className={styles.albumArt} style={{ maxWidth: '300px', height: 'auto' }} />
              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '2em', fontWeight: 'bold', color: 'var(--ctp-text)' }}>{vinyl.title}</p>
              <p style={{ textAlign: 'center', fontSize: '1.5em', color: 'var(--ctp-mauve)' }}>{vinyl.artist}</p>
              <p style={{ textAlign: 'center', fontSize: '1.1em', color: 'var(--ctp-subtext1)' }}>Year: {vinyl.year}</p>
              <div className={styles.genrePills} style={{ marginTop: '15px' }}>
                {vinyl.genre.map((g, idx) => (
                  <span key={idx} className={styles.genrePill}>{g}</span>
                ))}
              </div>
            </div>

            {discogsDetails && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '40px 0' }} />
                <div style={{ marginTop: '30px' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Discogs Details</h2>
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
                  {discogsDetails.notes && (
                    <div className="window" style={{ marginBottom: '15px' }}>
                      <div className="title-bar" style={{ cursor: 'pointer' }} onClick={() => setShowNotes(!showNotes)}>
                        Notes {showNotes ? '▲' : '▼'}
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
                      <div className="title-bar" style={{ cursor: 'pointer' }} onClick={() => setShowTracklist(!showTracklist)}>
                        Tracklist {showTracklist ? '▲' : '▼'}
                      </div>
                      {showTracklist && (
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
                    <p><a href={discogsDetails.uri} target="_blank" rel="noopener noreferrer">View on Discogs</a></p>
                  )}
                </div>
              </>
            )}

            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={() => router.back()}>Back to Collection</button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
