"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import PageLoader from "../components/PageLoader";
import Button from "../components/Button";
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
    return <PageLoader text="Loading collections..." />;
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          {/* Hero Section */}
          <div className={styles.collectionsHeroSection}>
            <div className={styles.collectionsHeroContent}>
              <div className={styles.collectionsTitle}>
                <h1>Collections</h1>
                <p>Organize your vinyl records into curated collections</p>
              </div>

              {!showCreateForm && !editingCollection && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  size="medium"
                >
                  New Collection
                </Button>
              )}
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingCollection) && (
            <div className={styles.modalOverlay}>
              <div className={styles.modernFormModal}>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>
                    {editingCollection
                      ? "Edit Collection"
                      : "Create Collection"}
                  </h2>
                  <Button
                    onClick={
                      editingCollection
                        ? cancelEditing
                        : () => setShowCreateForm(false)
                    }
                    variant="outline"
                    size="small"
                  >
                    ✕
                  </Button>
                </div>

                <form
                  onSubmit={
                    editingCollection
                      ? handleEditCollection
                      : handleCreateCollection
                  }
                  className={styles.modernFormGrid}
                >
                  <div className={styles.formInputSection}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Collection Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter collection name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={100}
                        className={styles.modernFormInput}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Description</label>
                      <textarea
                        placeholder="Enter description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className={styles.modernFormTextarea}
                      />
                    </div>
                  </div>
                  <div className={styles.formOptionsSection}>
                    <div className={styles.inputGroup}>
                      <label className={styles.modernFormCheckbox}>
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>
                          Make collection public
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <Button
                      onClick={
                        editingCollection
                          ? cancelEditing
                          : () => setShowCreateForm(false)
                      }
                      variant="outline"
                      size="medium"
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={formLoading}
                      variant="primary"
                      size="medium"
                    >
                      {formLoading
                        ? "Saving..."
                        : editingCollection
                        ? "Update Collection"
                        : "Create Collection"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Collections Content */}
          {collections.length === 0 ? (
            <div className={styles.modernEmptyState}>
              <div className={styles.emptyStateIcon}>📚</div>
              <h3 className={styles.emptyStateTitle}>No collections yet</h3>
              <p className={styles.emptyStateDescription}>
                Create your first collection to start organizing your vinyl
                records
              </p>
              {!showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  size="medium"
                >
                  Create Collection
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.collectionsList}>
              {collections.map((collection) => (
                <div key={collection.id} className={styles.collectionItem}>
                  {/* Left: Collection Name & Badges */}
                  <div className={styles.collectionLeft}>
                    <div className={styles.titleRow}>
                      <Link
                        href={`/collections/${collection.id}`}
                        className={styles.collectionLink}
                      >
                        <h3 className={styles.collectionTitle}>
                          {collection.title}
                        </h3>
                      </Link>
                      <div className={styles.inlineBadges}>
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
                  </div>

                  {/* Middle: Stats */}
                  <div className={styles.collectionMiddle}>
                    <span className={styles.recordCount}>
                      {collection._count.vinyls}{" "}
                      {collection._count.vinyls === 1 ? "record" : "records"}
                    </span>
                    <span className={styles.createdDate}>
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className={styles.collectionRight}>
                    <Button
                      onClick={() => startEditing(collection)}
                      variant="outline"
                      size="small"
                    >
                      Edit
                    </Button>
                    {!collection.isDefault && (
                      <>
                        <Button
                          onClick={() => handleSetDefault(collection)}
                          variant="outline"
                          size="small"
                        >
                          Set Default
                        </Button>
                        <Button
                          onClick={() => handleDeleteCollection(collection)}
                          variant="danger"
                          size="small"
                        >
                          Delete
                        </Button>
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
