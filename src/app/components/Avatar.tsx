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
  "#dc2626", // red
  "#ea580c", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0284c7", // sky
  "#2563eb", // blue
  "#7c3aed", // violet
  "#c026d3", // fuchsia
  "#dc2626", // red (duplicate for variety)
];

const AVATAR_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
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
  const [uploading, setUploading] = useState(false);

  const sizeClass = `${styles.avatar} ${styles[size]}`;

  // Generate avatar based on type
  const renderAvatar = () => {
    if ((avatarType === "url" || avatarType === "uploaded") && avatar) {
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
      // For letter avatars, generate a color for the background
      const generated = generateAvatar(username);
      return (
        <div
          className={styles.avatarLetter}
          style={{ backgroundColor: generated.color, color: "white" }}
        >
          {avatar}
        </div>
      );
    } else {
      // Generated avatar
      const generated = generateAvatar(username);
      return (
        <div
          className={styles.avatarLetter}
          style={{ backgroundColor: generated.color, color: "white" }}
        >
          {generated.letter}
        </div>
      );
    }
  };

  const handleLetterSelect = (letter: string) => {
    if (onAvatarChange) {
      onAvatarChange(letter, "letter");
    }
    setShowPicker(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (
      !file.type.startsWith("image/") ||
      (!file.type.includes("jpeg") &&
        !file.type.includes("jpg") &&
        !file.type.includes("png"))
    ) {
      alert("Please select a valid image file (JPG or PNG)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/auth/upload-profile-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload image");
      }

      const data = await res.json();

      if (onAvatarChange) {
        onAvatarChange(data.imageUrl, "uploaded");
      }
      setShowPicker(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.avatarContainer}>
      <div
        className={`${sizeClass} ${editable ? styles.editable : ""}`}
        onClick={editable ? () => setShowPicker(!showPicker) : undefined}
        title={editable ? "Click to change avatar" : username}
      >
        {renderAvatar()}
        {editable && <div className={styles.editOverlay}>✏️</div>}
      </div>

      {editable && showPicker && (
        <div className={styles.letterPicker}>
          <div className={styles.pickerHeader}>Choose an avatar</div>

          {/* Image Upload Section */}
          <div className={styles.uploadSection}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageUpload}
              disabled={uploading}
              className={styles.fileInput}
              id="avatar-upload"
            />
            <button
              className={styles.uploadButton}
              onClick={() => document.getElementById("avatar-upload")?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "📁 Upload Image"}
            </button>
          </div>

          {/* Letter Selection */}
          <div className={styles.letterSection}>
            <div className={styles.sectionTitle}>Or choose a letter:</div>
            <div className={styles.letterGrid}>
              {AVATAR_LETTERS.map((letter) => (
                <button
                  key={letter}
                  className={styles.letterOption}
                  onClick={() => handleLetterSelect(letter)}
                  style={{
                    backgroundColor:
                      AVATAR_COLORS[
                        letter.charCodeAt(0) % AVATAR_COLORS.length
                      ],
                    color: "white",
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
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
