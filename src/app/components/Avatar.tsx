'use client'

import { useState } from 'react'
import styles from './Avatar.module.css'

interface AvatarProps {
  username: string
  avatar?: string | null
  avatarType?: string
  size?: 'small' | 'medium' | 'large'
  editable?: boolean
  onAvatarChange?: (avatar: string, avatarType: string) => void
}

const AVATAR_COLORS = [
  '#f38ba8', // red
  '#fab387', // peach  
  '#f9e2af', // yellow
  '#a6e3a1', // green
  '#94e2d5', // teal
  '#89dceb', // sky
  '#89b4fa', // blue
  '#cba6f7', // mauve
  '#f5c2e7', // pink
  '#eba0ac', // maroon
]

const AVATAR_EMOJIS = [
  '🎵', '🎶', '🎸', '🎹', '🎺', '🎷', '🥁', '🎤', '🎧', '📻',
  '💿', '📀', '🎼', '🎵', '🔊', '🎚️', '🎛️', '🔈', '🔉', '🔊'
]

function generateAvatar(username: string): { emoji: string; color: string } {
  // Create a simple hash from username to ensure consistency
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const emojiIndex = Math.abs(hash) % AVATAR_EMOJIS.length
  const colorIndex = Math.abs(hash >> 8) % AVATAR_COLORS.length
  
  return {
    emoji: AVATAR_EMOJIS[emojiIndex],
    color: AVATAR_COLORS[colorIndex]
  }
}

export default function Avatar({ 
  username, 
  avatar, 
  avatarType = 'generated', 
  size = 'medium', 
  editable = false,
  onAvatarChange 
}: AvatarProps) {
  const [showPicker, setShowPicker] = useState(false)
  
  const sizeClass = `${styles.avatar} ${styles[size]}`
  
  // Generate avatar based on type
  const renderAvatar = () => {
    if (avatarType === 'url' && avatar) {
      return (
        <img 
          src={avatar} 
          alt={`${username}'s avatar`}
          className={styles.avatarImage}
          onError={(e) => {
            // Fallback to generated avatar if image fails to load
            const generated = generateAvatar(username)
            const target = e.target as HTMLElement
            target.style.display = 'none'
            if (target.parentElement) {
              target.parentElement.style.backgroundColor = generated.color
              target.parentElement.textContent = generated.emoji
            }
          }}
        />
      )
    } else if (avatarType === 'emoji' && avatar) {
      return <span className={styles.avatarEmoji}>{avatar}</span>
    } else {
      // Generated avatar
      const generated = generateAvatar(username)
      return (
        <span 
          className={styles.avatarEmoji}
          style={{ color: generated.color }}
        >
          {generated.emoji}
        </span>
      )
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (onAvatarChange) {
      onAvatarChange(emoji, 'emoji')
    }
    setShowPicker(false)
  }

  return (
    <div className={styles.avatarContainer}>
      <div 
        className={`${sizeClass} ${editable ? styles.editable : ''}`}
        onClick={editable ? () => setShowPicker(!showPicker) : undefined}
        title={editable ? 'Click to change avatar' : username}
      >
        {renderAvatar()}
        {editable && (
          <div className={styles.editOverlay}>
            ✏️
          </div>
        )}
      </div>
      
      {editable && showPicker && (
        <div className={styles.emojiPicker}>
          <div className={styles.pickerHeader}>Choose an avatar</div>
          <div className={styles.emojiGrid}>
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className={styles.emojiOption}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className={styles.pickerActions}>
            <button 
              className={styles.cancelButton}
              onClick={() => setShowPicker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}