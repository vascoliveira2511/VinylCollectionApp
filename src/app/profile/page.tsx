'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

interface Vinyl {
  id: number
  artist: string
  title: string
  year?: number
  genre: string[]
  imageUrl?: string
  discogsId?: number
}

interface User {
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const fetchUserData = async () => {
    const res = await fetch('/api/auth/user')
    if (!res.ok) {
      router.push('/login')
    } else {
      const userData = await res.json()
      setUser(userData)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) {
    return <p>Loading...</p>
  }
  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Profile</div>
          <div className={styles.contentSection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h1>Welcome, {user.username}!</h1>
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

