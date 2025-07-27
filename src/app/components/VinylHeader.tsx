"use client";

import { useState } from "react";
import styles from "../page.module.css";
// If using TypeScript and CSS modules, ensure you have a declaration file (*.d.ts) for CSS modules.
// For example, create src/app/page.module.css.d.ts with:
// declare const styles: { [className: string]: string };
// export default styles;

interface VinylHeaderProps {
  title: string;
  artist: string | string[];
  year?: number;
  country?: string;
  genres?: string[];
  styleTags?: string[];
  images?: Array<{
    uri: string;
    uri500?: string;
    uri150?: string;
    type?: string;
  }>;
  rating?: number;
  showBackground?: boolean;
  actions?: React.ReactNode;
}

export default function VinylHeader({
  title,
  artist,
  year,
  country,
  genres = [],
  styleTags = [],
  images = [],
  rating,
  showBackground = true,
  actions,
}: VinylHeaderProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const displayImages = images.length > 0 ? images : [];
  const currentImage = displayImages[selectedImage] || displayImages[0];
  const backgroundImage = displayImages[0]; // Always use first image for background

  const renderRating = (rating: number) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  const formatArtist = (artist: string | string[]) => {
    if (Array.isArray(artist)) {
      return artist.join(", ");
    }
    return artist;
  };

  return (
    <>
      {/* Background blur effect - Fixed to first image */}
      {showBackground && backgroundImage && (
        <div
          style={{
            backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(
              backgroundImage.uri500 || backgroundImage.uri
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
            WebkitFilter: "blur(20px)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            opacity: 0.3,
          }}
        />
      )}

      {/* Header with album art and basic info */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        {/* Image Gallery */}
        {displayImages.length > 0 && (
          <div className={styles.imageGallery}>
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(
                currentImage.uri500 || currentImage.uri
              )}`}
              alt={`${title} cover`}
              className={styles.albumArt}
              style={{
                maxWidth: "400px",
                height: "auto",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            />
            {displayImages.length > 1 && (
              <div className={styles.imageThumbnails}>
                {displayImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={`/api/image-proxy?url=${encodeURIComponent(
                      img.uri150 || img.uri
                    )}`}
                    alt={`${title} ${img.type}`}
                    className={`${styles.thumbnail} ${
                      idx === selectedImage ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <h1
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "2em",
            fontWeight: "bold",
            color: "var(--ctp-text)",
          }}
        >
          {title}
        </h1>

        <div className={styles.artistList}>
          <span
            style={{
              textAlign: "center",
              fontSize: "1.5em",
              color: "var(--ctp-mauve)",
              margin: "5px 0",
            }}
          >
            {formatArtist(artist)}
          </span>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "1.1em",
            color: "var(--ctp-subtext1)",
          }}
        >
          {year} {country && `• ${country}`}
        </p>

        {/* Genre pills */}
        <div className={styles.genrePills} style={{ marginTop: "15px" }}>
          {genres.map((g, idx) => (
            <span key={idx} className={styles.genrePill}>
              {g}
            </span>
          ))}
          {styleTags.map((s, idx) => (
            <span key={idx} className={styles.stylePill}>
              {s}
            </span>
          ))}
        </div>

        {/* Rating display */}
        {rating && (
          <div
            style={{
              marginTop: "15px",
              fontSize: "1.2em",
              textAlign: "center",
            }}
          >
            <div>{renderRating(rating)}</div>
            <div
              style={{
                fontSize: "0.9em",
                color: "var(--ctp-subtext1)",
                marginTop: "5px",
              }}
            >
              Personal Rating: {rating}/5
            </div>
          </div>
        )}

        {/* Action buttons */}
        {actions && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
