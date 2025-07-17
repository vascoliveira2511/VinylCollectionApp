'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

interface User {
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
  discogsUsername?: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [discogsUsernameInput, setDiscogsUsernameInput] = useState('')
  const [discogsAvatarUrl, setDiscogsAvatarUrl] = useState<string | null>(null)
  const [totalDiscogsItems, setTotalDiscogsItems] = useState<number | null>(null)
  const [discogsReleases, setDiscogsReleases] = useState<Vinyl[]>([])
  const router = useRouter()

  const fetchUserData = async () => {
    console.log('Profile: Fetching user data...')
    const res = await fetch('/api/auth/user')
    if (!res.ok) {
      console.log('Profile: User not authenticated, redirecting to login.')
      router.push('/login')
    } else {
      const userData = await res.json()
      console.log('Profile: Received user data', userData)
      setUser(userData)
      setDiscogsUsernameInput(userData.discogsUsername || '')
      if (userData.discogsUsername) {
        console.log('Profile: Calling fetchDiscogsAvatar with', userData.discogsUsername)
        fetchDiscogsAvatar(userData.discogsUsername)
        fetchDiscogsCollectionStats(userData.discogsUsername)
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchDiscogsAvatar = async (username: string) => {
    console.log('Profile: Fetching Discogs avatar for', username)
    try {
      const res = await fetch(`/api/discogs/user-profile?username=${encodeURIComponent(username)}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Profile: Received Discogs avatar data', data)
        setDiscogsAvatarUrl(data.avatarUrl)
      } else {
        setDiscogsAvatarUrl(null)
        console.error('Profile: Failed to fetch Discogs avatar', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Profile: Error fetching Discogs avatar:', error)
      setDiscogsAvatarUrl(null)
    }
  }

  const fetchDiscogsCollectionStats = async (username: string) => {
    console.log('Profile: Fetching Discogs collection stats for', username)
    try {
      const res = await fetch(`/api/discogs/user-collection-stats?username=${encodeURIComponent(username)}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Profile: Received Discogs collection stats', data)
        setTotalDiscogsItems(data.totalDiscogsItems)
      } else {
        setTotalDiscogsItems(null)
        console.error('Profile: Failed to fetch Discogs collection stats', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Profile: Error fetching Discogs collection stats:', error)
      setTotalDiscogsItems(null)
    }
  }

  const handleDiscogsUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Profile: Submitting Discogs username', discogsUsernameInput)
    const res = await fetch('/api/auth/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discogsUsername: discogsUsernameInput }),
    })
    if (res.ok) {
      console.log('Profile: Discogs username updated successfully on backend.')
      alert('Discogs username updated!')
      fetchUserData() // Re-fetch user data to update avatar and stats
    } else {
      console.error('Profile: Failed to update Discogs username on backend.', res.status, res.statusText)
      alert('Failed to update Discogs username.')
    }
  }

  const logout = async () => {
    console.log('Profile: Logging out...')
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) {
    console.log('Profile: User data not loaded yet.')
    return <p>Loading...</p> // Or a proper loader
  }

  console.log('Profile: Rendering with user', user, 'and avatar', discogsAvatarUrl)
  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Profile</div>
          <div className={styles.contentSection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h1>Welcome, {user.username}!</h1>

                {discogsAvatarUrl && (
                  <img src={`/api/image-proxy?url=${encodeURIComponent(discogsAvatarUrl)}`} alt="Discogs Avatar" className={styles.discogsAvatar} />
                )}

                <form onSubmit={handleDiscogsUsernameSubmit} className={styles.form} style={{ gridTemplateColumns: '1fr' }}>
                  <input
                    type="text"
                    placeholder="Discogs Username"
                    value={discogsUsernameInput}
                    onChange={(e) => setDiscogsUsernameInput(e.target.value)}
                  />
                  <button type="submit">Save Discogs Username</button>
                </form>

                <p className={styles.totalRecordsText}>Total Records in Collection: {user.totalRecords}</p>
                <button onClick={logout}>Logout</button>
              </div>

              <div>
                <h2>Records by Genre:</h2>
                <ul>
                  {Object.entries(user.genreStats).map(([genre, count]) => (
                    <li key={genre}>
                      {genre}: {count}
                    </li>
                  ))}
                </ul>

                <h2>Recently Added:</h2>
                <ul>
                  {user.recentVinyls.map((vinyl) => (
                    <li key={vinyl.id}>
                      {vinyl.artist} - {vinyl.title} ({vinyl.year})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

