'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      
      if (res.ok) {
        router.push('/login')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create account')
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
            <h1 className={styles.appTitle}>Join Vinyl Collection</h1>
            <p className={styles.appSubtitle}>Start organizing your music collection today</p>
          </div>

          {/* Signup Form */}
          <div className={styles.loginCard}>
            <div className="title-bar">Create Account</div>
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
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.loginInput}
                    minLength={3}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="password" className={styles.inputLabel}>Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.loginInput}
                    minLength={6}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPassword" className={styles.inputLabel}>Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
              
              <div className={styles.loginFooter}>
                <p>Already have an account? <Link href="/login" className={styles.signupLink}>Sign in</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
