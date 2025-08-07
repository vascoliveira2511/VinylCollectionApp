"use client";

import { useState } from "react";
import Button from "./Button";
import styles from "../page.module.css";

interface Collection {
  id: number;
  title: string;
  description?: string;
  isDefault: boolean;
  type?: string;
  _count: {
    vinyls: number;
  };
}

interface AddToCollectionButtonProps {
  collections: Collection[];
  onAdd: (collectionId?: number) => void;
  onAddToWantlist?: () => void;
  disabled?: boolean;
  existingVinyls?: any[];
}

export default function AddToCollectionButton({
  collections,
  onAdd,
  onAddToWantlist,
  disabled = false,
  existingVinyls = [],
}: AddToCollectionButtonProps) {
  const [showAllCollections, setShowAllCollections] = useState(false);

  // Find the default collection
  const defaultCollection = collections.find((c) => c.isDefault);

  // Check if vinyl already exists in collections
  const getExistingVinyl = (collectionId?: number) => {
    return existingVinyls.find((v) =>
      collectionId ? v.collectionId === collectionId : v.collection?.isDefault
    );
  };

  // Check if vinyl already exists in wantlist
  const getExistingInWantlist = () => {
    return existingVinyls.find((v) => v.collection?.type === "wantlist");
  };

  if (collections.length === 0) {
    return (
      <Button variant="secondary" size="medium" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <div className={styles.collectionButtonGroup}>
      {/* Primary Actions Row */}
      <div className={styles.primaryActions}>
        {defaultCollection && (
          <Button
            onClick={() => onAdd(defaultCollection.id)}
            disabled={disabled}
            variant={
              getExistingVinyl(defaultCollection.id) ? "outline" : "primary"
            }
            size="medium"
            className={`${styles.addToDefaultButton} ${
              getExistingVinyl(defaultCollection.id)
                ? styles.alreadyInCollection
                : ""
            }`}
          >
            {getExistingVinyl(defaultCollection.id)
              ? "Already in Collection"
              : "Add to Collection"}
          </Button>
        )}

        {onAddToWantlist && (
          <Button
            onClick={onAddToWantlist}
            disabled={disabled}
            variant={getExistingInWantlist() ? "outline" : "secondary"}
            size="medium"
            className={`${styles.addToWantlistButton} ${
              getExistingInWantlist() ? styles.alreadyInCollection : ""
            }`}
          >
            {getExistingInWantlist()
              ? "Already in Wantlist"
              : "Add to Wantlist"}
          </Button>
        )}
      </div>

      {/* Show More Collections */}
      {collections.length > 1 && (
        <div className={styles.secondaryActions}>
          <Button
            onClick={() => setShowAllCollections(!showAllCollections)}
            disabled={disabled}
            variant="outline"
            size="medium"
            className={styles.showMoreButton}
          >
            {showAllCollections
              ? "Show Less"
              : `Choose from ${collections.length} Collections`}
          </Button>
        </div>
      )}

      {/* All Collections Grid */}
      {showAllCollections && (
        <div className={styles.collectionsGrid}>
          {collections.map((collection) => (
            <Button
              key={collection.id}
              onClick={() => {
                onAdd(collection.id);
                setShowAllCollections(false);
              }}
              disabled={disabled}
              variant={collection.isDefault ? "primary" : "outline"}
              size="small"
              className={styles.collectionGridButton}
            >
              <div className={styles.collectionButtonContent}>
                <span className={styles.collectionButtonName}>
                  {collection.title}
                </span>
                <span className={styles.collectionButtonCount}>
                  {collection._count.vinyls}
                </span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
