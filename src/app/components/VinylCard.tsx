"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, memo } from "react";
import styles from "../page.module.css";

interface VinylCardProps {
  vinyl: {
    id: number | string;
    artist: string;
    title: string;
    year?: number | null;
    imageUrl?: string | null;
    genre: string[];
    discogsId?: number;
    createdAt?: string;
    updatedAt?: string;
    thumb?: string;
    format?: string[] | string;
    country?: string;
    label?: string[] | string;
    catno?: string;
    type?: "release" | "master";
    uri?: string;
    // Additional fields for enhanced display
    barcode?: string[];
    master_id?: number;
    community?: {
      have: number;
      want: number;
    };
    // Personal collection fields (user editable)
    condition?: string;
    sleeveCondition?: string;
    rating?: number;
    description?: string;
  };
  showActions?: boolean;
  showDetails?: boolean;
  linkPrefix?: string;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onAdd?: (vinyl: any) => void;
  // New props for collection selection
  addToCollectionComponent?: React.ReactNode;
  priority?: boolean; // For above-the-fold images
  hideCommunityStats?: boolean; // Hide community stats (have/want)
}

const VinylCard = memo(function VinylCard({
  vinyl,
  showActions = true,
  showDetails = false,
  linkPrefix = "/vinyl",
  onEdit,
  onDelete,
  onAdd,
  addToCollectionComponent,
  priority = false,
  hideCommunityStats = false,
}: VinylCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the best available image URL (APIs now provide improved URLs)
  const imageUrl =
    vinyl.imageUrl || vinyl.thumb || "https://via.placeholder.com/150x150/f0ece7/1a1a1a?text=No+Image";

  const linkUrl =
    linkPrefix === "/browse"
      ? `/browse/${vinyl.discogsId || vinyl.id}`
      : `${linkPrefix}/${vinyl.id}`;

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  return (
    <div className={styles.card}>
      <Link href={linkUrl}>
        <div className={styles.imageContainer}>
          {isLoading && (
            <div className={styles.imagePlaceholder}>
              <div className="vinyl-loader">
                <div className="vinyl-record"></div>
              </div>
            </div>
          )}
          <Image
            src={imageError ? "https://via.placeholder.com/150x150/f0ece7/1a1a1a?text=No+Image" : `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`}
            alt={`${vinyl.title} by ${vinyl.artist}`}
            className={styles.albumArt}
            width={150}
            height={150}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyEhjyw6H+FpMCf2eVvZl1F5mAb9bBBhgbLzzzrw/3zt7ZrqcXoaStgmtnyBFQu8W3LagHQlHYsStSrxgPEfWuOvv5+8RD6V7zq97eBHcW9pJl6X8sKNdJIbKJl3oIrJF/xBqpXhNE3UKVjTEuGagqJPECCfSEYPUu5w+7JKq/nX7P6e5uYLT3pOCN4e5RvYZkuLQPcrKpNOJkVj6vQW4l8LlxEq5qrJmK2Zxu8qrHx9T3fwJuvb5U/WuOvv5+8RD6V7zq97eBHcW9pJl6X8sKNdJIbKJl3oIrJF/xBqpXhNE3UKVjTEuGagqJPECCfSEYPUu5w+7JKq/nX7P6e5uYLT3pOCN4e5RvYZkuLQPcrKpNOJkVj6vQW4l8LlxEq5qrJmK2Zxu8qrHx9T3f"
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        </div>
        
        
        <div className={styles.cardInfo}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{vinyl.title}</h3>
            <p className={styles.cardArtist}>{vinyl.artist}</p>
          </div>

          {showDetails && (
            <div className={styles.cardMeta}>
              <div className={styles.metaLine}>
                {(vinyl.year || vinyl.country) && (
                  <div className={styles.releaseInfo}>
                    {vinyl.year && <span className={styles.releaseYear}>{vinyl.year}</span>}
                    {vinyl.year && vinyl.country && <span className={styles.metaSeparator}>•</span>}
                    {vinyl.country && <span className={styles.releaseCountry}>{vinyl.country}</span>}
                  </div>
                )}
                {vinyl.type === "master" && (
                  <span className={styles.metaMaster}>Master</span>
                )}
              </div>
              {vinyl.format && (
                <div className={styles.metaFormat}>
                  {Array.isArray(vinyl.format) ? vinyl.format[0] : vinyl.format}
                </div>
              )}
              {vinyl.label && (
                <div className={styles.metaLabel}>
                  {Array.isArray(vinyl.label) ? vinyl.label[0] : vinyl.label}
                  {vinyl.catno && (
                    <span className={styles.metaCatno}> • {vinyl.catno}</span>
                  )}
                </div>
              )}
              {vinyl.barcode && vinyl.barcode.length > 0 && (
                <div className={styles.metaBarcode}>
                  Barcode: {vinyl.barcode[0]}
                </div>
              )}
              {/* Personal Rating Only */}
              {vinyl.rating && (
                <div className={styles.personalDetails}>
                  <div className={styles.personalRating}>
                    <span className={styles.ratingStars}>
                      {"★".repeat(vinyl.rating)}{"☆".repeat(5 - vinyl.rating)}
                    </span>
                    <span className={styles.ratingText}>{vinyl.rating}/5</span>
                  </div>
                </div>
              )}
              {vinyl.community && !hideCommunityStats && (
                <div className={styles.metaCommunity}>
                  <span className={styles.communityHave}>
                    Have: {vinyl.community.have}
                  </span>
                  <span className={styles.communityWant}>
                    Want: {vinyl.community.want}
                  </span>
                </div>
              )}
            </div>
          )}

          {!showDetails && vinyl.year && <p>{vinyl.year}</p>}



          {vinyl.createdAt && (
            <p className={styles.addedDate}>
              Added {new Date(vinyl.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </Link>

      {showActions && (
        <div className={styles.buttonGroup}>
          {addToCollectionComponent ? (
            addToCollectionComponent
          ) : onAdd ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAdd(vinyl);
              }}
              className={styles.createButton}
            >
              Add
            </button>
          ) : null}
          {onEdit && (
            <Link
              href={`/vinyl/${vinyl.id}/edit`}
              className={styles.editButton}
            >
              Edit
            </Link>
          )}
          {onDelete && (
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.preventDefault();
                onDelete(vinyl.id);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default VinylCard;
