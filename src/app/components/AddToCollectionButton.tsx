"use client";

import { useState } from "react";
import styles from "../page.module.css";

interface Collection {
  id: number;
  title: string;
  description?: string;
  isDefault: boolean;
  _count: {
    vinyls: number;
  };
}

interface AddToCollectionButtonProps {
  collections: Collection[];
  onAdd: (collectionId?: number) => void;
  disabled?: boolean;
}

export default function AddToCollectionButton({
  collections,
  onAdd,
  disabled = false,
}: AddToCollectionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Find the default collection
  const defaultCollection = collections.find(c => c.isDefault);
  
  const handleQuickAdd = () => {
    // Add to default collection
    onAdd(defaultCollection?.id);
    setShowDropdown(false);
  };
  
  const handleSelectCollection = (collectionId: number) => {
    onAdd(collectionId);
    setShowDropdown(false);
  };
  
  if (collections.length === 0) {
    return (
      <button className={styles.createButton} disabled>
        ➕ Loading...
      </button>
    );
  }
  
  if (collections.length === 1) {
    // If only one collection, just add directly
    return (
      <button
        onClick={() => onAdd(collections[0].id)}
        disabled={disabled}
        className={styles.createButton}
      >
        ➕ Add
      </button>
    );
  }
  
  return (
    <div className={styles.addButtonContainer}>
      <button
        onClick={handleQuickAdd}
        disabled={disabled}
        className={styles.createButton}
        title={`Add to ${defaultCollection?.title || "default collection"}`}
      >
        ➕ Add
      </button>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={styles.dropdownToggle}
        title="Choose collection"
      >
        ▼
      </button>
      
      {showDropdown && (
        <div className={styles.collectionDropdown}>
          <div className={styles.dropdownHeader}>Choose Collection:</div>
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => handleSelectCollection(collection.id)}
              className={styles.collectionOption}
            >
              <span className={styles.collectionName}>
                {collection.title}
                {collection.isDefault && " (Default)"}
              </span>
              <span className={styles.collectionCount}>
                {collection._count.vinyls} records
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}