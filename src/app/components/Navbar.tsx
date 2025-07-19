'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Avatar from './Avatar'
import styles from './Navbar.module.css'

interface User {
  username: string
  avatar?: string
  avatarType?: string
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user')
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        }
      } catch (error) {
        // User not logged in or error fetching
        setUser(null)
      }
    }

    fetchUser()
  }, [])

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.navBrand}>
          <span className={styles.brandIcon}>🎵</span>
          <span className={styles.brandText}>Vinyl Collection</span>
        </Link>
        
        <ul className={styles.navList}>
          {user && (
            <>
              <li className={styles.navItem}>
                <Link href="/" className={pathname === '/' ? styles.activeLink : ''}>
                  Home
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/collections" className={pathname === '/collections' ? styles.activeLink : ''}>
                  Collections
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/stats" className={pathname === '/stats' ? styles.activeLink : ''}>
                  Stats
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/profile" className={`${styles.profileLink} ${pathname === '/profile' ? styles.activeProfile : ''}`}>
                  <Avatar 
                    username={user.username}
                    avatar={user.avatar}
                    avatarType={user.avatarType}
                    size="small"
                  />
                  <span className={styles.username}>{user.username}</span>
                </Link>
              </li>
            </>
          )}
          
          {!user && (
            <>
              <li className={styles.navItem}>
                <Link href="/login" className={styles.authLink}>Login</Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/signup" className={styles.authLink}>Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
