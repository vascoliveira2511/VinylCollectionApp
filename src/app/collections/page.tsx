"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import styles from "../page.module.css";

interface Collection {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  isPublic?: boolean;
  isDefault: boolean;
  createdAt: string;
  _count: {
    vinyls: number;
  };
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("#6c7ce7");
  const [isPublic, setIsPublic] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const router = useRouter();

  const fetchCollections = async () => {
    try {
      const data = await apiClient.getCollections();
      setCollections(data as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [router]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Collection title is required");
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await apiClient.createCollection({
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        color: color || null,
        isPublic,
      });

      // Reset form and refresh collections
      setTitle("");
      setDescription("");
      setImageUrl("");
      setColor("#6c7ce7");
      setIsPublic(false);
      setShowCreateForm(false);

      // Force refresh collections after creation
      const data = await apiClient.getCollections({ cache: "force-refresh" });
      setCollections(data as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCollection || !title.trim()) {
      setError("Collection title is required");
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await apiClient.updateCollection(editingCollection.id.toString(), {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        color: color || null,
        isPublic,
      });

      // Reset form and refresh collections
      setTitle("");
      setDescription("");
      setImageUrl("");
      setColor("#6c7ce7");
      setIsPublic(false);
      setEditingCollection(null);

      // Force refresh collections after update
      const data = await apiClient.getCollections({ cache: "force-refresh" });
      setCollections(data as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    if (collection.isDefault) {
      setError("Cannot delete default collection");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${collection.title}"? All vinyls will be moved to your default collection.`
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteCollection(collection.id.toString());

      // Force refresh collections after deletion
      const data = await apiClient.getCollections({ cache: "force-refresh" });
      setCollections(data as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const startEditing = (collection: Collection) => {
    setEditingCollection(collection);
    setTitle(collection.title);
    setDescription(collection.description || "");
    setImageUrl(collection.imageUrl || "");
    setColor(collection.color || "#6c7ce7");
    setIsPublic(collection.isPublic || false);
    setShowCreateForm(false);
  };

  const handleSetDefault = async (collection: Collection) => {
    if (collection.isDefault) {
      return; // Already default
    }

    if (!confirm(`Set "${collection.title}" as your default collection?`)) {
      return;
    }

    try {
      await apiClient.setDefaultCollection(collection.id);

      // Force refresh collections after setting default
      const data = await apiClient.getCollections({ cache: "force-refresh" });
      setCollections(data as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const cancelEditing = () => {
    setEditingCollection(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setColor("#6c7ce7");
    setIsPublic(false);
    setError(null);
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading collections...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.modernContainer}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1>Collections</h1>
            <p>Organize your vinyl records into curated collections</p>
          </div>
          
          {!showCreateForm && !editingCollection && (
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.modernCreateButton}
            >
              New Collection
            </button>
          )}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCollection) && (
          <div className={styles.modernForm}>
            <div className={styles.formHeader}>
              <h2>
                {editingCollection
                  ? "Edit Collection"
                  : "Create Collection"}
              </h2>
              <button
                type="button"
                onClick={
                  editingCollection
                    ? cancelEditing
                    : () => setShowCreateForm(false)
                }
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <form
              onSubmit={
                editingCollection
                  ? handleEditCollection
                  : handleCreateCollection
              }
              className={styles.formGrid}
            >
              <div className={styles.formSection}>
                <input
                  type="text"
                  placeholder="Collection name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className={styles.modernInput}
                />
                
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={styles.modernTextarea}
                />

                <input
                  type="url"
                  placeholder="Cover image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={styles.modernInput}
                />
              </div>

              <div className={styles.formMeta}>
                <div className={styles.colorSection}>
                  <label htmlFor="collection-color">Theme Color</label>
                  <input
                    id="collection-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={styles.modernColorPicker}
                  />
                </div>

                <label className={styles.modernCheckbox}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span>Make public</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={formLoading} className={styles.primaryButton}>
                  {formLoading
                    ? "Saving..."
                    : editingCollection
                    ? "Update Collection"
                    : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collections List */}
        <div className={styles.collectionsContainer}>
          {collections.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>No collections yet</h3>
              <p>Create your first collection to start organizing your vinyl records</p>
            </div>
          ) : (
            <div className={styles.modernCollectionsList}>
              {collections.map((collection) => (
                <div key={collection.id} className={styles.modernCollectionItem}>
                  <Link href={`/collections/${collection.id}`} className={styles.collectionLink}>
                    <div className={styles.collectionInfo}>
                      <div className={styles.collectionTitle}>
                        <h3>{collection.title}</h3>
                        <div className={styles.badges}>
                          {collection.isDefault && (
                            <span className={styles.defaultBadge}>Default</span>
                          )}
                          {collection.isPublic && (
                            <span className={styles.publicBadge}>Public</span>
                          )}
                        </div>
                      </div>
                      {collection.description && (
                        <p className={styles.collectionDescription}>
                          {collection.description}
                        </p>
                      )}
                      <div className={styles.collectionStats}>
                        <span>{collection._count.vinyls} records</span>
                        <span>•</span>
                        <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                  
                  <div className={styles.collectionActions}>
                    <button
                      onClick={() => startEditing(collection)}
                      className={styles.actionButton}
                    >
                      Edit
                    </button>
                    {!collection.isDefault && (
                      <>
                        <button
                          onClick={() => handleSetDefault(collection)}
                          className={styles.actionButton}
                        >
                          Set Default
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection)}
                          className={`${styles.actionButton} ${styles.dangerButton}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
