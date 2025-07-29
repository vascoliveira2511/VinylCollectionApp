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
  extraartists?: Array<{
    name: string;
    id: number;
    role: string;
    tracks?: string;
    join?: string;
    anv?: string;
  }>;
  identifiers?: Array<{
    type: string;
    value: string;
    description?: string;
  }>;
  uri: string;
  estimated_weight: number;
  lowest_price: number;
  num_for_sale: number;
  master_id?: number; // Added to fix type error
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
  const [comments, setComments] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPersonalNotes, setShowPersonalNotes] = useState(false);
  const [userStatus, setUserStatus] = useState<"want" | "have" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  const [newRating, setNewRating] = useState<number | undefined>(undefined);
  const [isReview, setIsReview] = useState<boolean>(false);
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
    return "★".repeat(rating) + "☆".repeat(5 - rating);
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
  const backgroundImage = displayImages[0]; // Always use first image for background

  return (
    <main className={styles.main}>
      {/* Enhanced background with vinyl groove effect */}
      {backgroundImage && (
        <>
          <div className={styles.vinylPageBackground}>
            <div
              className={styles.albumCoverBackground}
              style={{
                backgroundImage: `url(/api/image-proxy?url=${encodeURIComponent(
                  backgroundImage.uri500 || backgroundImage.uri
                )})`,
              }}
            ></div>
            <div className={styles.vinylGrooveOverlay}></div>
          </div>
        </>
      )}

      <div className={styles.vinylPageContainer}>
        {/* Hero Section with Album Art and Info */}
        <div className={styles.vinylHeroSection}>
          <div className={styles.vinylHeroContent}>
            {/* Album Art */}
            <div className={styles.vinylAlbumArt}>
              {displayImages && displayImages.length > 0 && (
                <>
                  <div className={styles.mainAlbumCover}>
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(
                        currentImage.uri500 || currentImage.uri
                      )}`}
                      alt={`${vinyl.title} cover`}
                      className={styles.coverImage}
                    />
                  </div>
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
                            idx === selectedImage ? styles.thumbnailActive : ""
                          }`}
                          onClick={() => setSelectedImage(idx)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vinyl Info */}
            <div className={styles.vinylHeroInfo}>
              <div className={styles.vinylTitleSection}>
                <h1 className={styles.modernVinylTitle}>{vinyl.title}</h1>
                <h2 className={styles.modernVinylArtist}>{vinyl.artist}</h2>
                <div className={styles.vinylMetaInfo}>
                  <span className={styles.vinylYear}>{vinyl.year}</span>
                  {vinyl.country && (
                    <>
                      <span className={styles.metaSeparator}>•</span>
                      <span className={styles.vinylCountry}>{vinyl.country}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Pills */}
              {(vinyl.genre?.length > 0 || discogsDetails?.styles?.length > 0) && (
                <div className={styles.modernGenrePills}>
                  {vinyl.genre?.map((g, idx) => (
                    <span key={`genre-${idx}`} className={styles.modernGenrePill}>
                      {g}
                    </span>
                  ))}
                  {discogsDetails?.styles?.map((s, idx) => (
                    <span key={`style-${idx}`} className={styles.modernGenrePill}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Personal Rating */}
              {vinyl.rating && (
                <div className={styles.personalRating}>
                  <div className={styles.ratingStars}>
                    {renderRating(vinyl.rating)}
                  </div>
                  <div className={styles.ratingText}>
                    Your Rating: {vinyl.rating}/5
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.modernActionButtons}>
                <Link href={`/vinyl/${id}/edit`} className={styles.modernEditButton}>
                  Edit Details
                </Link>
                <button onClick={handleDelete} className={styles.modernDeleteButton}>
                  Delete
                </button>
                <button onClick={() => router.back()} className={styles.modernBackButton}>
                  ← Back
                </button>
              </div>

              {/* Status Buttons */}
              {vinyl.discogsId && (
                <div className={styles.statusButtonGroup}>
                  <button
                    onClick={() => handleStatusChange("want")}
                    className={`${styles.modernStatusButton} ${
                      userStatus === "want" ? styles.statusWantActive : styles.statusWant
                    }`}
                  >
                    {userStatus === "want" ? "★ In Wantlist" : "Want"}
                  </button>
                  <button
                    onClick={() => handleStatusChange("have")}
                    className={`${styles.modernStatusButton} ${
                      userStatus === "have" ? styles.statusHaveActive : styles.statusHave
                    }`}
                  >
                    {userStatus === "have" ? "✓ Have" : "Mark as Have"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info - Simplified */}
        <div className={styles.vinylSimpleContent}>
          {/* Collection Info */}
          {(vinyl.collection || vinyl.condition || vinyl.sleeveCondition) && (
            <div className={styles.infoSection}>
              <h3>Collection Details</h3>
              <div className={styles.infoGrid}>
                {vinyl.collection && (
                  <div><strong>Collection:</strong> {vinyl.collection.title}</div>
                )}
                {vinyl.condition && (
                  <div><strong>Media:</strong> {vinyl.condition}</div>
                )}
                {vinyl.sleeveCondition && (
                  <div><strong>Sleeve:</strong> {vinyl.sleeveCondition}</div>
                )}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {vinyl.description && (
            <div className={styles.infoSection}>
              <h3 
                onClick={() => setShowPersonalNotes(!showPersonalNotes)}
                style={{ cursor: 'pointer' }}
              >
                Personal Notes {showPersonalNotes ? '▲' : '▼'}
              </h3>
              {showPersonalNotes && (
                <div className={styles.notesContent}>
                  {vinyl.description}
                </div>
              )}
            </div>
          )}

          {/* Release Info */}
          {discogsDetails && (
            <div className={styles.infoSection}>
              <h3>Release Information</h3>
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
          )}

          {/* Videos */}
          {discogsDetails?.videos && discogsDetails.videos.length > 0 && (
            <div className={styles.infoSection}>
              <h3>Videos</h3>
              <VinylVideos videos={discogsDetails.videos} />
            </div>
          )}

          {/* Comments */}
          {vinyl.discogsId && (
            <div className={styles.infoSection}>
              <h3>Community Reviews</h3>
              <VinylComments discogsId={vinyl.discogsId} />
            </div>
          )}

          {/* External Link */}
          {discogsDetails?.uri && (
            <div className={styles.infoSection}>
              <a
                href={discogsDetails.uri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.discogsLink}
              >
                View on Discogs →
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
