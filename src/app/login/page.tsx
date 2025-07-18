'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/')
    } else {
      // Handle login error
      alert('Invalid credentials')
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={`window ${styles.formContainer}`}>
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={styles.fullWidthInput}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.fullWidthInput}
              />
              <div className={styles.formActions}>
                <button type="submit">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
