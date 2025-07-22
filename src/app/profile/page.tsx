'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Avatar from '../components/Avatar'
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
  avatar?: string
  avatarType?: string
  // Preferences
  displayView?: string
  recordsPerPage?: number
  showGenreChart?: boolean
  showDecadeChart?: boolean
  showArtistChart?: boolean
  discogsEnabled?: boolean
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
  
  // Preferences state
  const [displayView, setDisplayView] = useState('grid')
  const [recordsPerPage, setRecordsPerPage] = useState(20)
  const [showGenreChart, setShowGenreChart] = useState(true)
  const [showDecadeChart, setShowDecadeChart] = useState(true)
  const [showArtistChart, setShowArtistChart] = useState(true)
  const [discogsEnabled, setDiscogsEnabled] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(false)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)
  
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
      
          // Set preferences from user data
      setDisplayView(userData.displayView || 'grid')
      setRecordsPerPage(userData.recordsPerPage || 20)
      setShowGenreChart(userData.showGenreChart !== undefined ? userData.showGenreChart : true)
      setShowDecadeChart(userData.showDecadeChart !== undefined ? userData.showDecadeChart : true)
      setShowArtistChart(userData.showArtistChart !== undefined ? userData.showArtistChart : true)
      setDiscogsEnabled(userData.discogsEnabled !== undefined ? userData.discogsEnabled : true)
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

  const handleAvatarChange = async (avatar: string, avatarType: string) => {
    try {
      setError(null)
      const res = await fetch('/api/auth/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar, avatarType })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update avatar')
      }
      
      // Update local user state
      if (user) {
        setUser({
          ...user,
          avatar,
          avatarType
        })
      }
      
      // Force a page refresh to update navbar
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
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

  const savePreferences = async () => {
    setPreferencesLoading(true)
    setError(null)
    setPreferencesSuccess(false)
    
    try {
      const preferences = {
        displayView,
        recordsPerPage,
        showGenreChart,
        showDecadeChart,
        showArtistChart,
        discogsEnabled
      }
      
      console.log('Saving preferences:', preferences)
      
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save preferences')
      }
      
      setPreferencesSuccess(true)
      
      // Update local user state with saved preferences
      if (user) {
        setUser({
          ...user,
          displayView,
          recordsPerPage,
          showGenreChart,
          showDecadeChart,
          showArtistChart,
          discogsEnabled
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPreferencesLoading(false)
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
                className={activeTab === 'preferences' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('preferences')}
              >
                Preferences
              </button>
              <button 
                className={activeTab === 'security' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
              <button 
                className={activeTab === 'data' ? styles.tabActive : styles.tabInactive}
                onClick={() => setActiveTab('data')}
              >
                Data & Privacy
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
                      <div className={styles.avatarSection}>
                        <Avatar 
                          username={user.username}
                          avatar={user.avatar}
                          avatarType={user.avatarType}
                          size="large"
                          editable={true}
                          onAvatarChange={handleAvatarChange}
                        />
                      </div>
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
                        <Link key={vinyl.id} href={`/vinyl/${vinyl.id}`} className={styles.recentVinyl}>
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

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className={styles.tabContent}>
                <h2>Display Preferences</h2>
                
                {preferencesSuccess && (
                  <div className={styles.successMessage}>
                    ✅ Preferences saved successfully!
                  </div>
                )}
                
                <div className={styles.preferencesGrid}>
                  <div className={styles.preferenceCard}>
                    <h3>Collection Display</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.preferenceLabel}>
                        <span>Default Collection View</span>
                        <select 
                          className={styles.preferenceSelect}
                          value={displayView}
                          onChange={(e) => setDisplayView(e.target.value)}
                        >
                          <option value="grid">Grid View</option>
                          <option value="list">List View</option>
                          <option value="compact">Compact View</option>
                        </select>
                      </label>
                      <label className={styles.preferenceLabel}>
                        <span>Records per Page</span>
                        <select 
                          className={styles.preferenceSelect}
                          value={recordsPerPage}
                          onChange={(e) => setRecordsPerPage(parseInt(e.target.value))}
                        >
                          <option value={12}>12 records</option>
                          <option value={20}>20 records</option>
                          <option value={24}>24 records</option>
                          <option value={48}>48 records</option>
                          <option value={96}>96 records</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  
                  <div className={styles.preferenceCard}>
                    <h3>Statistics</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={showGenreChart}
                          onChange={(e) => setShowGenreChart(e.target.checked)}
                        />
                        <span>Show genre charts by default</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={showDecadeChart}
                          onChange={(e) => setShowDecadeChart(e.target.checked)}
                        />
                        <span>Show year distribution</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={showArtistChart}
                          onChange={(e) => setShowArtistChart(e.target.checked)}
                        />
                        <span>Show artist statistics</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" disabled />
                        <span>Show country breakdown (Coming Soon)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className={styles.preferenceCard}>
                    <h3>Discogs Integration</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={discogsEnabled}
                          onChange={(e) => setDiscogsEnabled(e.target.checked)}
                        />
                        <span>Enable Discogs integration</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked disabled />
                        <span>Include high-resolution images (Coming Soon)</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" disabled />
                        <span>Show marketplace prices (Coming Soon)</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className={styles.formActions} style={{ marginTop: '30px' }}>
                  <button 
                    onClick={savePreferences} 
                    disabled={preferencesLoading}
                    className={styles.primaryButton}
                  >
                    {preferencesLoading ? '💾 Saving...' : '💾 Save Preferences'}
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

            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <div className={styles.tabContent}>
                <h2>Data & Privacy</h2>
                
                <div className={styles.dataGrid}>
                  <div className={styles.dataCard}>
                    <h3>Data Export</h3>
                    <p className={styles.dataDescription}>
                      Download your complete vinyl collection data in various formats.
                    </p>
                    <div className={styles.exportButtons}>
                      <button className={styles.exportButton}>
                        Export as JSON
                      </button>
                      <button className={styles.exportButton}>
                        Export as CSV
                      </button>
                      <button className={styles.exportButton}>
                        Export as PDF Report
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.dataCard}>
                    <h3>Data Import</h3>
                    <p className={styles.dataDescription}>
                      Import vinyl collection data from other sources.
                    </p>
                    <div className={styles.importSection}>
                      <input 
                        type="file" 
                        accept=".json,.csv"
                        className={styles.fileInput}
                        id="importFile"
                      />
                      <label htmlFor="importFile" className={styles.fileLabel}>
                        Choose File
                      </label>
                      <button className={styles.importButton} disabled>
                        Import Data
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.dataCard}>
                    <h3>Privacy Settings</h3>
                    <div className={styles.privacySection}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" />
                        <span>Make collection publicly viewable</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked />
                        <span>Allow anonymous usage analytics</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked />
                        <span>Receive feature updates via email</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className={styles.dataCard}>
                    <h3>Storage Information</h3>
                    <div className={styles.storageInfo}>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>Total Records:</span>
                        <span className={styles.storageValue}>{user.totalRecords}</span>
                      </div>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>Account Created:</span>
                        <span className={styles.storageValue}>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>Data Size:</span>
                        <span className={styles.storageValue}>~{Math.ceil(user.totalRecords * 0.5)} KB</span>
                      </div>
                    </div>
                  </div>
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

