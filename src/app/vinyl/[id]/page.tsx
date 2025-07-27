"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import SimpleReleaseInfo from "../../components/SimpleReleaseInfo";
import VinylVideos from "../../components/VinylVideos";
import VinylComments from "../../components/VinylComments";
import styles from "../../page.module.css";

interface Vinyl {
  country: string;
  id: number;
  artist: string;
  title: string;
  year: number;
  imageUrl: string;
  genre: string[];
  discogsId?: number;
  createdAt?: string;
  updatedAt?: string;
  collection?: {
    id: number;
    title: string;
    isDefault: boolean;
  };
  // Personal collection fields (user editable)
  condition?: string; // Media condition
  sleeveCondition?: string; // Sleeve condition
  rating?: number;
  description?: string; // Personal notes
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists: Array<{
    name: string;
    id: number;
  }>;
  labels: Array<{
    name: string;
    catno: string;
    id: number;
  }>;
  formats: Array<{
    name: string;
    qty: string;
    descriptions: string[];
  }>;
  genres: string[];
  styles: string[];
  year: number;
  country: string;
  released: string;
  notes: string;
  images: Array<{
    type: string;
    uri: string;
    uri150: string;
    uri500: string;
  }>;
  tracklist: Array<{
    position: string;
    type_: string;
    title: string;
    duration: string;
  }>;
  videos: Array<{
    uri: string;
    title: string;
    description: string;
    duration: number;
  }>;
  companies: Array<{
    name: string;
    catno: string;
    entity_type: string;
    entity_type_name: string;
  }>;
  uri: string;
  estimated_weight: number;
  lowest_price: number;
  num_for_sale: number;
}

export default function VinylDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [vinyl, setVinyl] = useState<Vinyl | null>(null);
  const [discogsDetails, setDiscogsDetails] = useState<DiscogsRelease | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPersonalNotes, setShowPersonalNotes] = useState(false);
  const [userStatus, setUserStatus] = useState<"want" | "have" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function to format Discogs notes
  const formatDiscogsNotes = (notes: string) => {
    let formattedText = notes
      .replace(/\n/g, "<br/>") // Replace newlines with <br/>
      .replace(
        /\[url=(.*?)\](.*?)\[\/url\]/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
      ) // Handle [url=...] links
      .replace(
        /\[r(\d+)\]/g,
        '<a href="https://www.discogs.com/release/$1" target="_blank" rel="noopener noreferrer">[r$1]</a>'
      ); // Handle [r...] release links
    return { __html: formattedText };
  };

  // Helper function to render rating stars
  const renderRating = (rating: number) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string = "USD") => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CHF: "CHF",
      CNY: "¥",
      SEK: "kr",
      NOK: "kr",
      DKK: "kr",
      PLN: "zł",
      CZK: "Kč",
      HUF: "Ft",
      RUB: "₽",
      BRL: "R$",
      INR: "₹",
      KRW: "₩",
      SGD: "S$",
      NZD: "NZ$",
      ZAR: "R",
      MXN: "$",
      THB: "฿",
      TRY: "₺",
    };
    return symbols[currency] || currency;
  };

  useEffect(() => {
    const fetchVinylDetails = async () => {
      try {
        const data = (await apiClient.getVinyl(id)) as Vinyl;
        setVinyl(data);

        if (data.discogsId) {
          try {
            const [discogsData, commentsData, statusData] = await Promise.all([
              apiClient.getDiscogsRelease(data.discogsId.toString()),
              fetch(`/api/vinyl-comments?discogsId=${data.discogsId}`).then(
                (res) => (res.ok ? res.json() : [])
              ),
              fetch(`/api/vinyl-status?discogsId=${data.discogsId}`).then(
                (res) => (res.ok ? res.json() : { status: null })
              ),
            ]);
            setDiscogsDetails(discogsData as DiscogsRelease);
            setComments(commentsData);
            setUserStatus(statusData.status);
          } catch (error) {
            console.error("Failed to fetch Discogs details", error);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVinylDetails();
    }
  }, [id, router]);

  const handleDelete = async () => {
    if (!vinyl) return;

    if (
      !confirm(
        `Are you sure you want to delete "${vinyl.title}" by ${vinyl.artist}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteVinyl(id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vinyl");
    }
  };

  const handleStatusChange = async (status: "want" | "have") => {
    if (!vinyl?.discogsId) return;

    try {
      // Toggle status - if already set to this status, remove it
      const newStatus = userStatus === status ? null : status;

      const response = await fetch("/api/vinyl-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discogsId: vinyl.discogsId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setUserStatus(newStatus);

        if (newStatus === "want") {
          alert(`Added to your wantlist!`);
        } else if (newStatus === "have") {
          alert(`Marked as owned!`);
        } else {
          alert(`Removed from ${status === "want" ? "wantlist" : "owned"}`);
        }
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to update status"));
      }
    } catch (err) {
      alert(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !vinyl?.discogsId) return;

    try {
      const response = await fetch("/api/vinyl-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discogsId: vinyl.discogsId,
          content: newComment,
          rating: newRating,
          isReview: isReview,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment("");
        setNewRating(undefined);
        setIsReview(false);
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to post comment"));
      }
    } catch (err) {
      alert(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
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

  if (error || !vinyl) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.errorState}>
                <p>{error || "Vinyl not found"}</p>
                <button
                  onClick={() => router.back()}
                  className={styles.backButton}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Get the best available image - priority: Discogs high-res, then user image
  const displayImages =
    discogsDetails?.images && discogsDetails.images.length > 0
      ? discogsDetails.images
      : [
          {
            uri: vinyl.imageUrl,
            uri500: vinyl.imageUrl,
            uri150: vinyl.imageUrl,
            type: "primary",
          },
        ];

  const currentImage = displayImages[selectedImage] || displayImages[0];

  return (
    <main className={styles.main}>
      {/* Background blur effect */}
      {currentImage && (
        <div
          style={{
            backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(
              currentImage.uri500 || currentImage.uri
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
            WebkitFilter: "blur(20px)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            opacity: 0.3,
          }}
        ></div>
      )}

      <div className="container">
        <div className="window">
          <div className={styles.contentSection}>
            {/* Two-column layout */}
            <div className={styles.vinylDetailLayout}>
              {/* Left Column - Album Art */}
              <div className={styles.vinylImageSection}>
                {displayImages && displayImages.length > 0 && (
                  <div className={styles.imageGallery}>
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(
                        currentImage.uri500 || currentImage.uri
                      )}`}
                      alt={`${vinyl.title} cover`}
                      className={styles.vinylCoverImage}
                    />
                    {displayImages.length > 1 && (
                      <div className={styles.imageThumbnails}>
                        {displayImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={`/api/image-proxy?url=${encodeURIComponent(
                              img.uri150 || img.uri
                            )}`}
                            alt={`${vinyl.title} ${img.type}`}
                            className={`${styles.thumbnail} ${
                              idx === selectedImage ? styles.selected : ""
                            }`}
                            onClick={() => setSelectedImage(idx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Info */}
              <div className={styles.vinylInfoSection}>
                <div className={styles.vinylHeader}>
                  <h1 className={styles.vinylTitle}>{vinyl.title}</h1>
                  <div className={styles.vinylArtist}>{vinyl.artist}</div>
                  <div className={styles.vinylMeta}>
                    {vinyl.year} {vinyl.country && `• ${vinyl.country}`}
                  </div>
                  
                  {/* Genre pills */}
                  <div className={styles.genrePills}>
                    {vinyl.genre?.map((g, idx) => (
                      <span key={idx} className={styles.genrePill}>
                        {g}
                      </span>
                    ))}
                    {discogsDetails?.styles?.map((s, idx) => (
                      <span key={idx} className={styles.genrePill}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

              {/* Rating display */}
              {vinyl.rating && (
                <div
                  style={{
                    marginTop: "15px",
                    fontSize: "1.2em",
                    textAlign: "center",
                  }}
                >
                  <div>{renderRating(vinyl.rating)}</div>
                  <div
                    style={{
                      fontSize: "0.9em",
                      color: "var(--ctp-subtext1)",
                      marginTop: "5px",
                    }}
                  >
                    Personal Rating: {vinyl.rating}/5
                  </div>
                </div>
              )}

                {/* Action buttons */}
                <div className={styles.vinylActions}>
                <Link href={`/vinyl/${id}/edit`} className={styles.editButton}>
                  Edit
                </Link>
                <button onClick={handleDelete} className={styles.deleteButton}>
                  Delete
                </button>
                {vinyl.discogsId && (
                  <>
                    <button
                      onClick={() => handleStatusChange("want")}
                      className={`${styles.statusButton} ${
                        userStatus === "want" ? styles.statusActive : ""
                      }`}
                    >
                      {userStatus === "want" ? "In Wantlist" : "Want"}
                    </button>

                    <button
                      onClick={() => handleStatusChange("have")}
                      className={`${styles.statusButton} ${
                        userStatus === "have" ? styles.statusActive : ""
                      }`}
                    >
                      {userStatus === "have" ? "Have" : "Mark as Have"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.back()}
                  className={styles.backButton}
                >
                  ← Back
                </button>
              </div>
            </div>

            {/* Personal Collection Info - Consolidated */}
            <div
              className="window"
              style={{
                marginBottom: "20px",
                backgroundColor: "var(--ctp-surface0)",
                border: "2px solid var(--ctp-mauve)",
              }}
            >
              <div
                className="title-bar"
                style={{
                  backgroundColor: "var(--ctp-mauve)",
                  color: "var(--ctp-crust)",
                }}
              >
                📝 My Collection
              </div>
              <div className={styles.contentSection}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    fontSize: "0.9em",
                  }}
                >
                  {/* Collection */}
                  {vinyl.collection && (
                    <div>
                      <strong>Collection:</strong>
                      <div style={{ marginTop: "2px" }}>
                        {vinyl.collection.title}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <strong>Status:</strong>
                    <div style={{ marginTop: "2px" }}>
                      {userStatus === "want" && (
                        <span style={{ color: "var(--ctp-red)" }}>
                          In Wantlist
                        </span>
                      )}
                      {userStatus === "have" && (
                        <span style={{ color: "var(--ctp-green)" }}>
                          Have
                        </span>
                      )}
                      {!userStatus && (
                        <span style={{ color: "var(--ctp-green)" }}>
                          Owned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Media Condition */}
                  {vinyl.condition && (
                    <div>
                      <strong>Media:</strong>
                      <div style={{ marginTop: "2px" }}>{vinyl.condition}</div>
                    </div>
                  )}

                  {/* Sleeve Condition */}
                  {vinyl.sleeveCondition && (
                    <div>
                      <strong>Sleeve:</strong>
                      <div style={{ marginTop: "2px" }}>
                        {vinyl.sleeveCondition}
                      </div>
                    </div>
                  )}

                  {/* Personal Notes Preview */}
                  <div>
                    <strong>Notes:</strong>
                    <div
                      style={{
                        marginTop: "2px",
                        color: "var(--ctp-subtext1)",
                        fontSize: "0.85em",
                      }}
                    >
                      {vinyl.description
                        ? "Has personal notes (see below)"
                        : "No personal notes"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Release Information - Simple Layout */}
            {discogsDetails && (
              <div className="window" style={{ marginBottom: "20px" }}>
                <div className={styles.contentSection}>
                  <SimpleReleaseInfo
                    labels={discogsDetails.labels}
                    formats={discogsDetails.formats}
                    released={discogsDetails.released}
                    master_id={discogsDetails.master_id}
                    country={discogsDetails.country}
                    companies={discogsDetails.companies}
                    extraartists={discogsDetails.extraartists}
                    identifiers={discogsDetails.identifiers}
                    tracklist={discogsDetails.tracklist}
                    notes={discogsDetails.notes}
                  />
                </div>
              </div>
            )}

            {/* Personal Notes - Only show if user has added personal notes */}
            {vinyl.description && (
              <div
                className="window"
                style={{
                  marginBottom: "20px",
                  backgroundColor: "var(--ctp-surface0)",
                  border: "1px solid var(--ctp-mauve)",
                }}
              >
                <div
                  className="title-bar"
                  style={{
                    cursor: "pointer",
                    backgroundColor: "var(--ctp-surface1)",
                  }}
                  onClick={() => setShowPersonalNotes(!showPersonalNotes)}
                >
                  My Personal Notes {showPersonalNotes ? "▲" : "▼"}
                </div>
                {showPersonalNotes && (
                  <div className={styles.contentSection}>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        padding: "12px",
                        backgroundColor: "var(--ctp-base)",
                        borderRadius: "6px",
                        fontSize: "0.9em",
                        lineHeight: "1.4",
                      }}
                    >
                      {vinyl.description}
                    </div>
                  </div>
                )}
              </div>
            )}

            <VinylVideos videos={discogsDetails?.videos || []} />

            {vinyl.discogsId && <VinylComments discogsId={vinyl.discogsId} />}

            {/* External Links */}
            {discogsDetails?.uri && (
              <div style={{ textAlign: "center", marginTop: "30px" }}>
                <a
                  href={discogsDetails.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  View on Discogs →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
