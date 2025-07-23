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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.navBrand} onClick={closeMenu}>
          <span className={styles.brandIcon}>🎵</span>
          <span className={styles.brandText}>Vinyl Collection</span>
        </Link>
        
        {/* Hamburger menu button for mobile */}
        <button 
          className={styles.hamburger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
        </button>
        
        {/* Mobile menu overlay */}
        {isMenuOpen && <div className={styles.menuOverlay} onClick={closeMenu}></div>}
        
        <ul className={`${styles.navList} ${isMenuOpen ? styles.navListOpen : ''}`}>
          {user && (
            <>
              <li className={styles.navItem}>
                <Link href="/" className={pathname === '/' ? styles.activeLink : ''} onClick={closeMenu}>
                  Home
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/add" className={pathname === '/add' ? styles.activeLink : ''} onClick={closeMenu}>
                  Add Vinyl
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/collections" className={pathname === '/collections' ? styles.activeLink : ''} onClick={closeMenu}>
                  Collections
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/stats" className={pathname === '/stats' ? styles.activeLink : ''} onClick={closeMenu}>
                  Stats
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/friends" className={pathname === '/friends' ? styles.activeLink : ''} onClick={closeMenu}>
                  Friends
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/profile" className={`${styles.profileLink} ${pathname === '/profile' ? styles.activeProfile : ''}`} onClick={closeMenu}>
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
                <Link href="/login" className={styles.authLink} onClick={closeMenu}>Login</Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/signup" className={styles.authLink} onClick={closeMenu}>Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
