"use client";

import { useState } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  username: string;
  avatar?: string | null;
  avatarType?: string;
  size?: "small" | "medium" | "large";
  editable?: boolean;
  onAvatarChange?: (avatar: string, avatarType: string) => void;
}

const AVATAR_COLORS = [
  "var(--ctp-red)", // red
  "var(--ctp-peach)", // peach
  "var(--ctp-yellow)", // yellow
  "var(--ctp-green)", // green
  "var(--ctp-teal)", // teal
  "var(--ctp-sky)", // sky
  "var(--ctp-blue)", // blue
  "var(--ctp-mauve)", // mauve
  "var(--ctp-pink)", // pink
  "var(--ctp-maroon)", // maroon
];

const AVATAR_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
];

function generateAvatar(username: string): { letter: string; color: string } {
  // Create a simple hash from username to ensure consistency
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const letterIndex = Math.abs(hash) % AVATAR_LETTERS.length;
  const colorIndex = Math.abs(hash >> 8) % AVATAR_COLORS.length;

  return {
    letter: AVATAR_LETTERS[letterIndex],
    color: AVATAR_COLORS[colorIndex],
  };
}

export default function Avatar({
  username,
  avatar,
  avatarType = "generated",
  size = "medium",
  editable = false,
  onAvatarChange,
}: AvatarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const sizeClass = `${styles.avatar} ${styles[size]}`;

  // Generate avatar based on type
  const renderAvatar = () => {
    if (avatarType === "url" && avatar) {
      return (
        <img
          src={avatar}
          alt={`${username}'s avatar`}
          className={styles.avatarImage}
          onError={(e) => {
            // Fallback to generated avatar if image fails to load
            const generated = generateAvatar(username);
            const target = e.target as HTMLElement;
            target.style.display = "none";
            if (target.parentElement) {
              target.parentElement.style.backgroundColor = generated.color;
              target.parentElement.textContent = generated.letter;
            }
          }}
        />
      );
    } else if (avatarType === "letter" && avatar) {
      return <span className={styles.avatarLetter}>{avatar}</span>;
    } else {
      // Generated avatar
      const generated = generateAvatar(username);
      return (
        <span className={styles.avatarLetter} style={{ color: generated.color }}>
          {generated.letter}
        </span>
      );
    }
  };

  const handleLetterSelect = (letter: string) => {
    if (onAvatarChange) {
      onAvatarChange(letter, "letter");
    }
    setShowPicker(false);
  };

  return (
    <div className={styles.avatarContainer}>
      <div
        className={`${sizeClass} ${editable ? styles.editable : ""}`}
        onClick={editable ? () => setShowPicker(!showPicker) : undefined}
        title={editable ? "Click to change avatar" : username}
      >
        {renderAvatar()}
        {editable && <div className={styles.editOverlay}>Edit</div>}
      </div>

      {editable && showPicker && (
        <div className={styles.letterPicker}>
          <div className={styles.pickerHeader}>Choose an avatar</div>
          <div className={styles.letterGrid}>
            {AVATAR_LETTERS.map((letter) => (
              <button
                key={letter}
                className={styles.letterOption}
                onClick={() => handleLetterSelect(letter)}
              >
                {letter}
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
  );
}
