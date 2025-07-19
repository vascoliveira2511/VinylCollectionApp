'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  id: number
  username: string
  totalRecords: number
  genreStats: Record<string, number>
  recentVinyls: Vinyl[]
  createdAt: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  
  // Delete account form
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  const router = useRouter()

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/user')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch user data')
      }
      const userData = await res.json()
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setPasswordChangeLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to change password')
      }
      
      setPasswordChangeSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => setPasswordChangeSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (deleteConfirm !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion')
      return
    }
    
    setDeleteLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmDelete: deleteConfirm })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Unable to load profile</p>
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
          <div className="title-bar">Account Settings</div>
          <div className={styles.contentSection}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <button 
                className={activeTab === 'overview' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={activeTab === 'security' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
              <button 
                className={activeTab === 'danger' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('danger')}
              >
                Danger Zone
              </button>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className={styles.tabContent}>
                <h2>Account Overview</h2>
                <div className={styles.profileGrid}>
                  <div className={styles.profileCard}>
                    <h3>Profile Information</h3>
                    <div className={styles.profileInfo}>
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      <p><strong>Total Records:</strong> {user.totalRecords}</p>
                    </div>
                  </div>
                  
                  <div className={styles.profileCard}>
                    <h3>Collection Stats</h3>
                    <div className={styles.genreStats}>
                      {Object.entries(user.genreStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([genre, count]) => (
                          <div key={genre} className={styles.genreStat}>
                            <span className={styles.genreName}>{genre}</span>
                            <span className={styles.genreCount}>{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className={styles.profileCard}>
                    <h3>Recent Additions</h3>
                    <div className={styles.recentVinyls}>
                      {user.recentVinyls.slice(0, 5).map((vinyl) => (
                        <Link key={vinyl.id} href={`/collection/${vinyl.id}`} className={styles.recentVinyl}>
                          <span className={styles.vinylTitle}>{vinyl.title}</span>
                          <span className={styles.vinylArtist}>{vinyl.artist}</span>
                        </Link>
                      ))}
                      {user.recentVinyls.length === 0 && (
                        <p className={styles.emptyState}>No records added yet</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={styles.actionButtons}>
                  <button onClick={logout} className={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className={styles.tabContent}>
                <h2>Security Settings</h2>
                
                <div className={styles.securityCard}>
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    
                    {passwordChangeSuccess && (
                      <div className={styles.successMessage}>
                        Password changed successfully!
                      </div>
                    )}
                    
                    <button type="submit" disabled={passwordChangeLoading}>
                      {passwordChangeLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className={styles.tabContent}>
                <h2>Danger Zone</h2>
                
                <div className={styles.dangerCard}>
                  <h3>Delete Account</h3>
                  <p className={styles.dangerWarning}>
                    ⚠️ This action cannot be undone. This will permanently delete your account and all your vinyl records.
                  </p>
                  
                  <form onSubmit={handleDeleteAccount} className={styles.deleteForm}>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder='Type "DELETE" to confirm'
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      required
                    />
                    
                    <button 
                      type="submit" 
                      disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                      className={styles.deleteButton}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

