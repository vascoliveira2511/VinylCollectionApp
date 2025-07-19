'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginBackground}>
        <div className={styles.loginContainer}>
          {/* App Logo/Header */}
          <div className={styles.loginHeader}>
            <div className={styles.appLogo}>
              🎵
            </div>
            <h1 className={styles.appTitle}>Vinyl Collection</h1>
            <p className={styles.appSubtitle}>Organize your music, one record at a time</p>
          </div>

          {/* Login Form */}
          <div className={styles.loginCard}>
            <div className="title-bar">Welcome Back</div>
            <div className={styles.loginContent}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="username" className={styles.inputLabel}>Username</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.loginInput}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="password" className={styles.inputLabel}>Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.loginInput}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={styles.loginButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
              
              <div className={styles.loginFooter}>
                <p>Don't have an account? <Link href="/signup" className={styles.signupLink}>Sign up</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
