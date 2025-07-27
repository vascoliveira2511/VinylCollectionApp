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
      <div className="container">
        <div className="window">
          <div className="title-bar">My Collections</div>
          <div className={styles.contentSection}>
            <div className={styles.collectionsIntro}>
              <h2>Organize Your Vinyl Records</h2>
              <p>
                Collections help you organize your vinyl records into groups
                like "Jazz Classics", "Want List", "80s Hits", etc. You can
                create unlimited collections and move records between them
                easily.
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Create/Edit Form */}
            {(showCreateForm || editingCollection) && (
              <div className={styles.collectionForm}>
                <h3>
                  {editingCollection
                    ? "Edit Collection"
                    : "Create New Collection"}
                </h3>
                <form
                  onSubmit={
                    editingCollection
                      ? handleEditCollection
                      : handleCreateCollection
                  }
                >
                  <input
                    type="text"
                    placeholder="Collection Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />

                  <input
                    type="url"
                    placeholder="Cover Image URL (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />

                  <div className={styles.formRow}>
                    <div className={styles.colorSection}>
                      <label htmlFor="collection-color">🎨 Theme Color:</label>
                      <input
                        id="collection-color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className={styles.colorPicker}
                      />
                    </div>

                    <div className={styles.checkboxSection}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <span>🌐 Make collection public</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" disabled={formLoading}>
                      {formLoading
                        ? "Saving..."
                        : editingCollection
                        ? "Update"
                        : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={
                        editingCollection
                          ? cancelEditing
                          : () => setShowCreateForm(false)
                      }
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Action Buttons */}
            {!showCreateForm && !editingCollection && (
              <div className={styles.collectionActions}>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className={styles.createButton}
                >
                  Create New Collection
                </button>
              </div>
            )}

            {/* Collections Grid */}
            <div className={styles.collectionsGrid}>
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`${styles.collectionCard} ${
                    collection.color ? styles.hasCustomColor : ""
                  }`}
                  style={
                    collection.color
                      ? ({
                          "--collection-color": collection.color,
                        } as React.CSSProperties)
                      : {}
                  }
                >
                  {collection.imageUrl && (
                    <img
                      src={collection.imageUrl}
                      alt={`${collection.title} cover`}
                      className={styles.collectionCover}
                    />
                  )}

                  <div className={styles.collectionHeader}>
                    <h3>
                      <Link href={`/collections/${collection.id}`}>
                        {collection.title}
                        {collection.isDefault && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                        {collection.isPublic && (
                          <span className={styles.publicBadge}>🌐 Public</span>
                        )}
                      </Link>
                    </h3>
                    <div className={styles.collectionMeta}>
                      <span className={styles.vinylCount}>
                        {collection._count.vinyls} records
                      </span>
                    </div>
                  </div>

                  {collection.description && (
                    <p className={styles.collectionDescription}>
                      {collection.description}
                    </p>
                  )}

                  <div className={styles.collectionActions}>
                    <Link
                      href={`/collections/${collection.id}`}
                      className={styles.viewButton}
                    >
                      View Collection
                    </Link>

                    <button
                      onClick={() => startEditing(collection)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    {!collection.isDefault && (
                      <>
                        <button
                          onClick={() => handleSetDefault(collection)}
                          className={styles.setDefaultButton}
                        >
                          Set as Default
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {collections.length === 0 && (
              <div className={styles.emptyState}>
                <p>
                  No collections found. Create your first collection to get
                  started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
