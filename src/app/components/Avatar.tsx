"use client";
import { useState, useRef } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  username: string;
  avatar?: string | null;
  avatarType?: string;
  size?: "small" | "medium" | "large";
  editable?: boolean;
  onAvatarChange?: (avatar: string, avatarType: string) => void;
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

export default function Avatar({
  username,
  avatar,
  avatarType = "generated",
  size = "medium",
  editable = false,
  onAvatarChange,
}: AvatarProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Fallback to default avatar if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = DEFAULT_AVATAR;
          }}
        />
      );
    } else {
      // Default avatar for users without uploaded image
      return (
        <img
          src={DEFAULT_AVATAR}
          alt={`${username}'s avatar`}
          className={styles.avatarImage}
        />
      );
    }
  };

  const handleAvatarClick = () => {
    if (editable && !uploading) {
      fileInputRef.current?.click();
    }
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.avatarContainer}>
      <div
        className={`${sizeClass} ${editable ? styles.editable : ""} ${
          uploading ? styles.uploading : ""
        }`}
        onClick={handleAvatarClick}
        title={
          editable
            ? uploading
              ? "Uploading..."
              : "Click to change avatar"
            : username
        }
      >
        {renderAvatar()}
        {editable && (
          <div className={styles.editOverlay}>{uploading ? "⏳" : "✏️"}</div>
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleImageUpload}
          disabled={uploading}
          className={styles.hiddenFileInput}
        />
      )}
    </div>
  );
}
