"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Grid, Maximize2 } from "lucide-react";
import styles from "./ImageGallery.module.css";

interface Image {
  uri: string;
  uri150: string;
  uri500: string;
  type: string;
}

interface ImageGalleryProps {
  images: Image[];
  title: string;
  maxThumbnails?: number;
}

export default function ImageGallery({
  images,
  title,
  maxThumbnails = 4,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllThumbnails, setShowAllThumbnails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[selectedImage] || images[0];
  const visibleThumbnails = showAllThumbnails
    ? images
    : images.slice(0, maxThumbnails);
  const hasMoreImages = images.length > maxThumbnails;

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className={styles.imageGallery}>
        {/* Main Image Display */}
        <div className={styles.mainImageContainer}>
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(
              currentImage.uri500 || currentImage.uri
            )}`}
            alt={`${title} ${currentImage.type}`}
            className={styles.mainImage}
            onClick={() => setIsFullscreen(true)}
          />

          {/* Navigation Arrows - only show if multiple images */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.navButtonLeft}`}
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronUp size={24} />
              </button>
              <button
                className={`${styles.navButton} ${styles.navButtonRight}`}
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronDown size={24} />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            className={styles.fullscreenButton}
            onClick={() => setIsFullscreen(true)}
            aria-label="View fullscreen"
          >
            <Maximize2 size={18} />
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className={styles.imageCounter}>
              {selectedImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className={styles.thumbnailSection}>
            <div className={styles.thumbnailGrid}>
              {visibleThumbnails.map((img, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbnail} ${
                    idx === selectedImage ? styles.thumbnailActive : ""
                  }`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(
                      img.uri150 || img.uri
                    )}`}
                    alt={`${title} ${img.type}`}
                  />
                  <div className={styles.imageType}>{img.type}</div>
                </button>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hasMoreImages && (
              <button
                className={styles.showMoreButton}
                onClick={() => setShowAllThumbnails(!showAllThumbnails)}
              >
                <Grid size={16} />
                {showAllThumbnails
                  ? `Show Less (${maxThumbnails})`
                  : `Show All (${images.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className={styles.fullscreenModal}
          onClick={() => setIsFullscreen(false)}
        >
          <div className={styles.fullscreenContainer}>
            <button
              className={styles.closeButton}
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              ×
            </button>
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(
                currentImage.uri || currentImage.uri500
              )}`}
              alt={`${title} ${currentImage.type}`}
              className={styles.fullscreenImage}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.fullscreenNav} ${styles.fullscreenNavLeft}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous image"
                >
                  <ChevronUp size={32} />
                </button>
                <button
                  className={`${styles.fullscreenNav} ${styles.fullscreenNavRight}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next image"
                >
                  <ChevronDown size={32} />
                </button>
              </>
            )}

            {/* Fullscreen Image Info */}
            <div className={styles.fullscreenInfo}>
              <span>{currentImage.type}</span>
              <span>
                {selectedImage + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
