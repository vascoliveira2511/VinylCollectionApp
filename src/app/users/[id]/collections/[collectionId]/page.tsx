'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Avatar from '../../../../components/Avatar'
import styles from '../../../../page.module.css'

interface User {
  id: number
  username: string
  avatar?: string
  avatarType?: string
}

interface Vinyl {
  id: number
  artist: string
  title: string
  year?: number
  imageUrl?: string
  genre: string[]
  discogsId?: number
  createdAt: string
}

interface Collection {
  id: number
  title: string
  description?: string
  isPublic: boolean
  createdAt: string
  vinyls: Vinyl[]
  user: User
}

export default function FriendCollectionPage({ 
  params 
}: { 
  params: { id: string; collectionId: string } 
}) {
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCollection()
  }, [params.id, params.collectionId])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users/${params.id}/collections/${params.collectionId}`)
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          setError('You are not authorized to view this collection')
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
    } catch (error) {
      console.error('Error fetching collection:', error)
      setError('Failed to load collection')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Loading...</div>
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
            <div className="title-bar">Error</div>
            <div className={styles.contentSection}>
              <div className={styles.errorMessage}>
                {error || 'Collection not found'}
              </div>
              <div className={styles.formActions}>
                <Link href={`/users/${params.id}`} className={styles.backButton}>
                  ← Back to User Profile
                </Link>
              </div>
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
          <div className="title-bar">📚 {collection.title}</div>
          <div className={styles.contentSection}>
            <div className={styles.collectionHeader}>
              <div className={styles.collectionInfo}>
                <h1>{collection.title}</h1>
                {collection.description && (
                  <p className={styles.collectionDescription}>{collection.description}</p>
                )}
                <div className={styles.collectionMeta}>
                  <div className={styles.ownerInfo}>
                    <Avatar 
                      username={collection.user.username}
                      avatar={collection.user.avatar}
                      avatarType={collection.user.avatarType}
                      size="small"
                    />
                    <span>by {collection.user.username}</span>
                  </div>
                  <div className={styles.collectionStats}>
                    {collection.vinyls.length} records • Created {new Date(collection.createdAt).toLocaleDateString()}
                    {collection.isPublic && <span className={styles.publicBadge}>Public</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <Link href={`/users/${params.id}`} className={styles.backButton}>
                ← Back to {collection.user.username}'s Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Vinyl Records */}
        <div className="window">
          <div className="title-bar">🎵 Records ({collection.vinyls.length})</div>
          <div className={styles.contentSection}>
            {collection.vinyls.length === 0 ? (
              <div className={styles.emptyState}>
                <p>This collection is empty.</p>
              </div>
            ) : (
              <div className={styles.collectionGrid}>
                {collection.vinyls.map(vinyl => (
                  <div key={vinyl.id} className={styles.card}>
                    <div className={styles.cardContent}>
                      {vinyl.imageUrl && (
                        <img 
                          src={vinyl.imageUrl} 
                          alt={`${vinyl.artist} - ${vinyl.title}`}
                          className={styles.albumArt}
                        />
                      )}
                      <div className={styles.cardInfo}>
                        <h3>{vinyl.title}</h3>
                        <p><strong>Artist:</strong> {vinyl.artist}</p>
                        {vinyl.year && <p><strong>Year:</strong> {vinyl.year}</p>}
                        {vinyl.genre.length > 0 && (
                          <div className={styles.genrePills}>
                            {vinyl.genre.slice(0, 3).map((g, index) => (
                              <span key={index} className={styles.genrePill}>
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className={styles.addedDate}>
                          Added {new Date(vinyl.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}