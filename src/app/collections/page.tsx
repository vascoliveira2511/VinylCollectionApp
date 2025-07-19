'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'

interface Collection {
  id: number
  title: string
  description?: string
  isDefault: boolean
  createdAt: string
  _count: {
    vinyls: number
  }
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  
  const router = useRouter()

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch collections')
      }
      const data = await res.json()
      setCollections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [router])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Collection title is required')
      return
    }
    
    setFormLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create collection')
      }
      
      // Reset form and refresh collections
      setTitle('')
      setDescription('')
      setShowCreateForm(false)
      await fetchCollections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCollection || !title.trim()) {
      setError('Collection title is required')
      return
    }
    
    setFormLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update collection')
      }
      
      // Reset form and refresh collections
      setTitle('')
      setDescription('')
      setEditingCollection(null)
      await fetchCollections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (collection.isDefault) {
      setError('Cannot delete default collection')
      return
    }
    
    if (!confirm(`Are you sure you want to delete "${collection.title}"? All vinyls will be moved to your default collection.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete collection')
      }
      
      await fetchCollections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const startEditing = (collection: Collection) => {
    if (collection.isDefault) {
      setError('Cannot edit default collection')
      return
    }
    
    setEditingCollection(collection)
    setTitle(collection.title)
    setDescription(collection.description || '')
    setShowCreateForm(false)
  }

  const cancelEditing = () => {
    setEditingCollection(null)
    setTitle('')
    setDescription('')
    setError(null)
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading collections...</p>
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
          <div className="title-bar">My Collections</div>
          <div className={styles.contentSection}>
            <div className={styles.collectionsIntro}>
              <h2>Organize Your Vinyl Records</h2>
              <p>
                Collections help you organize your vinyl records into groups like "Jazz Classics", "Want List", "80s Hits", etc. 
                You can create unlimited collections and move records between them easily.
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Create/Edit Form */}
            {(showCreateForm || editingCollection) && (
              <div className={styles.collectionForm}>
                <h3>{editingCollection ? 'Edit Collection' : 'Create New Collection'}</h3>
                <form onSubmit={editingCollection ? handleEditCollection : handleCreateCollection}>
                  <input
                    type="text"
                    placeholder="Collection Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div className={styles.formActions}>
                    <button type="submit" disabled={formLoading}>
                      {formLoading ? 'Saving...' : (editingCollection ? 'Update' : 'Create')}
                    </button>
                    <button 
                      type="button" 
                      onClick={editingCollection ? cancelEditing : () => setShowCreateForm(false)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Action Buttons */}
            {!showCreateForm && !editingCollection && (
              <div className={styles.collectionActions}>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className={styles.createButton}
                >
                  Create New Collection
                </button>
              </div>
            )}

            {/* Collections Grid */}
            <div className={styles.collectionsGrid}>
              {collections.map((collection) => (
                <div key={collection.id} className={styles.collectionCard}>
                  <div className={styles.collectionHeader}>
                    <h3>
                      <Link href={`/collections/${collection.id}`}>
                        {collection.title}
                        {collection.isDefault && <span className={styles.defaultBadge}>Default</span>}
                      </Link>
                    </h3>
                    <div className={styles.collectionMeta}>
                      <span className={styles.vinylCount}>{collection._count.vinyls} records</span>
                    </div>
                  </div>
                  
                  {collection.description && (
                    <p className={styles.collectionDescription}>{collection.description}</p>
                  )}
                  
                  <div className={styles.collectionActions}>
                    <Link href={`/collections/${collection.id}`} className={styles.viewButton}>
                      View Collection
                    </Link>
                    
                    {!collection.isDefault && (
                      <>
                        <button 
                          onClick={() => startEditing(collection)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCollection(collection)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {collections.length === 0 && (
              <div className={styles.emptyState}>
                <p>No collections found. Create your first collection to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}