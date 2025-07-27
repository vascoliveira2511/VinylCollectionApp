"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../page.module.css";

interface Vinyl {
  id: number;
  artist: string;
  title: string;
  year: number;
  imageUrl: string;
  genre: string[];
  discogsId?: number;
  // Only editable fields
  condition?: string; // Media condition
  sleeveCondition?: string; // Sleeve condition
  rating?: number;
  description?: string; // Personal notes
  // Collection assignment
  collection?: {
    id: number;
    title: string;
    isDefault: boolean;
  };
}

interface Collection {
  id: number;
  title: string;
  isDefault: boolean;
  _count: {
    vinyls: number;
  };
}

export default function EditVinylPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  // Vinyl info (read-only)
  const [vinyl, setVinyl] = useState<Vinyl | null>(null);

  // Only editable fields
  const [condition, setCondition] = useState("");
  const [sleeveCondition, setSleeveCondition] = useState("");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | undefined
  >(undefined);

  // Other state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vinyl details
        const vinylRes = await fetch(`/api/collection/${id}`);
        if (!vinylRes.ok) {
          if (vinylRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch vinyl details");
        }
        const vinylData: Vinyl = await vinylRes.json();
        setVinyl(vinylData);

        // Set only editable fields
        setCondition(vinylData.condition || "");
        setSleeveCondition(vinylData.sleeveCondition || "");
        setRating(vinylData.rating);
        setDescription(vinylData.description || "");
        setSelectedCollectionId(vinylData.collection?.id);

        // Fetch collections
        const collectionsRes = await fetch("/api/collections");
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json();
          setCollections(collectionsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Only update the editable fields
      const updateData = {
        condition: condition || null,
        sleeveCondition: sleeveCondition || null,
        rating: rating || null,
        description: description || null,
        collectionId: selectedCollectionId,
      };

      const res = await fetch(`/api/collection/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update vinyl");

      setSuccessMessage(`✅ "${vinyl?.title}" updated successfully!`);

      // Redirect back to vinyl details after 2 seconds
      setTimeout(() => {
        router.push(`/vinyl/${id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading vinyl details...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!vinyl) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.errorState}>
                <p>❌ Vinyl not found</p>
                <Link href="/" className={styles.backButton}>
                  ← Back to Collection
                </Link>
              </div>
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
          <div className="title-bar">✏️ Edit Personal Details</div>
          <div className={styles.contentSection}>
            {/* Album Info (Read-only) */}
            <div className="window" style={{ marginBottom: "20px" }}>
              <div className="title-bar">Album Information</div>
              <div className={styles.contentSection}>
                <div
                  style={{ display: "flex", gap: "20px", alignItems: "center" }}
                >
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(
                      vinyl.imageUrl
                    )}`}
                    alt={`${vinyl.title} cover`}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h3
                      style={{ margin: "0 0 10px 0", color: "var(--ctp-text)" }}
                    >
                      {vinyl.title}
                    </h3>
                    <p
                      style={{ margin: "0 0 5px 0", color: "var(--ctp-mauve)" }}
                    >
                      {vinyl.artist}
                    </p>
                    <p style={{ margin: "0", color: "var(--ctp-subtext1)" }}>
                      {vinyl.year}
                    </p>
                    <div style={{ marginTop: "10px" }}>
                      {vinyl.genre.map((g, idx) => (
                        <span
                          key={idx}
                          className={styles.genrePill}
                          style={{ marginRight: "5px" }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && <div className={styles.errorMessage}>{error}</div>}

            {successMessage && (
              <div className={styles.successMessage}>{successMessage}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Personal Details Section */}
              <div className="window" style={{ marginBottom: "20px" }}>
                <div className="title-bar">Personal Collection Details</div>
                <div className={styles.contentSection}>
                  <div className={styles.editFormGrid}>
                    {/* Media Condition */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        💿 Media Condition
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">Not specified</option>
                        <option value="Mint (M)">Mint (M)</option>
                        <option value="Near Mint (NM)">Near Mint (NM)</option>
                        <option value="Very Good Plus (VG+)">
                          Very Good Plus (VG+)
                        </option>
                        <option value="Very Good (VG)">Very Good (VG)</option>
                        <option value="Good Plus (G+)">Good Plus (G+)</option>
                        <option value="Good (G)">Good (G)</option>
                        <option value="Fair (F)">Fair (F)</option>
                        <option value="Poor (P)">Poor (P)</option>
                      </select>
                    </div>

                    {/* Sleeve Condition */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        📦 Sleeve Condition
                      </label>
                      <select
                        value={sleeveCondition}
                        onChange={(e) => setSleeveCondition(e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">Not specified</option>
                        <option value="Mint (M)">Mint (M)</option>
                        <option value="Near Mint (NM)">Near Mint (NM)</option>
                        <option value="Very Good Plus (VG+)">
                          Very Good Plus (VG+)
                        </option>
                        <option value="Very Good (VG)">Very Good (VG)</option>
                        <option value="Good Plus (G+)">Good Plus (G+)</option>
                        <option value="Good (G)">Good (G)</option>
                        <option value="Fair (F)">Fair (F)</option>
                        <option value="Poor (P)">Poor (P)</option>
                      </select>
                    </div>

                    {/* Personal Rating */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        ⭐ Personal Rating
                      </label>
                      <select
                        value={rating || ""}
                        onChange={(e) =>
                          setRating(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <option value="">No rating</option>
                        <option value="1">⭐ 1 star</option>
                        <option value="2">⭐⭐ 2 stars</option>
                        <option value="3">⭐⭐⭐ 3 stars</option>
                        <option value="4">⭐⭐⭐⭐ 4 stars</option>
                        <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
                      </select>
                    </div>

                    {/* Collection Assignment */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "500",
                        }}
                      >
                        📁 Collection
                      </label>
                      <select
                        value={selectedCollectionId || ""}
                        onChange={(e) =>
                          setSelectedCollectionId(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        style={{ width: "100%" }}
                        required
                      >
                        <option value="">Choose a collection...</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.title}{" "}
                            {collection.isDefault ? "(Default)" : ""} •{" "}
                            {collection._count.vinyls} records
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Notes */}
              <div className="window" style={{ marginBottom: "20px" }}>
                <div className="title-bar">📝 Personal Notes</div>
                <div className={styles.contentSection}>
                  <textarea
                    placeholder="Add your personal notes about this record... (listening notes, memories, where you got it, etc.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className={styles.fullWidthInput}
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className={styles.formActions} style={{ marginTop: "30px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.primaryButton}
                >
                  {saving ? "💾 Saving..." : "💾 Save Changes"}
                </button>
                <Link href={`/vinyl/${id}`} className={styles.cancelButton}>
                  ❌ Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
