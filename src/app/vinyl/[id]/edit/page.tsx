"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from "../../../components/PageLoader";
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

      setSuccessMessage(`"${vinyl?.title}" updated successfully!`);

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
    return <PageLoader text="Loading vinyl details..." />;
  }

  if (!vinyl) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.errorState}>
                <p>Error: Vinyl not found</p>
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

  // Get background image for modern look
  const backgroundImage = vinyl.imageUrl;

  return (
    <main className={styles.main}>
      {/* Modern background with vinyl groove effect */}
      {backgroundImage && (
        <>
          <div className={styles.vinylPageBackground}>
            <div
              className={styles.albumCoverBackground}
              style={{
                backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(
                  backgroundImage
                )})`,
              }}
            ></div>
            <div className={styles.vinylGrooveOverlay}></div>
          </div>
        </>
      )}

      <div className={styles.vinylPageContainer}>
        {/* Modern Header Section */}
        <div className={styles.vinylHeroSection}>
          <div className={styles.vinylHeroContent}>
            {/* Album Art */}
            <div className={styles.vinylAlbumArt}>
              <div className={styles.mainAlbumCover}>
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(
                    vinyl.imageUrl
                  )}`}
                  alt={`${vinyl.title} cover`}
                  className={styles.coverImage}
                />
              </div>
            </div>

            {/* Vinyl Info */}
            <div className={styles.vinylHeroInfo}>
              <div className={styles.vinylTitleSection}>
                <h1 className={styles.modernVinylTitle}>{vinyl.title}</h1>
                <h2 className={styles.modernVinylArtist}>{vinyl.artist}</h2>
                <div className={styles.vinylMetaInfo}>
                  <span className={styles.vinylYear}>{vinyl.year}</span>
                </div>
                <p className={styles.editPageSubtitle}>Edit Personal Details</p>
              </div>

              {/* Genre Pills */}
              {vinyl.genre?.length > 0 && (
                <div className={styles.modernGenrePills}>
                  {vinyl.genre.map((g, idx) => (
                    <span
                      key={`genre-${idx}`}
                      className={styles.modernGenrePill}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Form Content */}
        <div className={styles.vinylSimpleContent}>
          {/* Error/Success Messages */}
          {error && (
            <div className={styles.infoSection}>
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className={styles.infoSection}>
              <div className={styles.successState}>
                <p className={styles.successMessage}>{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.modernForm}>
            {/* Personal Details Section */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>
                Personal Collection Details
              </h3>
              <div className={styles.modernFormGrid}>
                {/* Media Condition */}
                <div className={styles.formField}>
                  <label className={styles.modernLabel}>Media Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className={styles.modernSelect}
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
                <div className={styles.formField}>
                  <label className={styles.modernLabel}>Sleeve Condition</label>
                  <select
                    value={sleeveCondition}
                    onChange={(e) => setSleeveCondition(e.target.value)}
                    className={styles.modernSelect}
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
                <div className={styles.formField}>
                  <label className={styles.modernLabel}>Personal Rating</label>
                  <select
                    value={rating || ""}
                    onChange={(e) =>
                      setRating(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className={styles.modernSelect}
                  >
                    <option value="">No rating</option>
                    <option value="1">★ 1 star</option>
                    <option value="2">★★ 2 stars</option>
                    <option value="3">★★★ 3 stars</option>
                    <option value="4">★★★★ 4 stars</option>
                    <option value="5">★★★★★ 5 stars</option>
                  </select>
                </div>

                {/* Collection Assignment */}
                <div className={styles.formField}>
                  <label className={styles.modernLabel}>Collection</label>
                  <select
                    value={selectedCollectionId || ""}
                    onChange={(e) =>
                      setSelectedCollectionId(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className={styles.modernSelect}
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

            {/* Personal Notes */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Personal Notes</h3>
              <div className={styles.formField}>
                <textarea
                  placeholder="Add your personal notes about this record... (listening notes, memories, where you got it, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={styles.modernTextarea}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className={styles.infoSection}>
              <div className={styles.modernFormActions}>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.primaryButton}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
