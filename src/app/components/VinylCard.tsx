"use client";

import Link from "next/link";
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
  };
  showActions?: boolean;
  showDetails?: boolean;
  linkPrefix?: string;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onAdd?: (vinyl: any) => void;
  // New props for collection selection
  addToCollectionComponent?: React.ReactNode;
}

export default function VinylCard({
  vinyl,
  showActions = true,
  showDetails = false,
  linkPrefix = "/vinyl",
  onEdit,
  onDelete,
  onAdd,
  addToCollectionComponent,
}: VinylCardProps) {
  // Use the best available image URL (APIs now provide improved URLs)
  const imageUrl =
    vinyl.imageUrl || vinyl.thumb || "https://via.placeholder.com/150";

  const linkUrl =
    linkPrefix === "/browse"
      ? `/browse/${vinyl.id}`
      : `${linkPrefix}/${vinyl.id}`;

  return (
    <div className={styles.card}>
      <Link href={linkUrl}>
        <img
          src={`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`}
          alt={`${vinyl.title} cover`}
          className={styles.albumArt}
          loading="lazy"
        />
        <div className={styles.cardInfo}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{vinyl.title}</h3>
            <p className={styles.cardArtist}>{vinyl.artist}</p>
          </div>

          {showDetails && (
            <div className={styles.cardMeta}>
              <div className={styles.metaLine}>
                {vinyl.year && (
                  <span className={styles.metaYear}>{vinyl.year}</span>
                )}
                {vinyl.country && (
                  <span className={styles.metaCountry}>{vinyl.country}</span>
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
              {vinyl.community && (
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

          <div className={styles.cardTags}>
            {vinyl.genre &&
              vinyl.genre.slice(0, showDetails ? 2 : 3).map((g, idx) => (
                <span key={idx} className={styles.genrePill}>
                  {g}
                </span>
              ))}
          </div>

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
}
