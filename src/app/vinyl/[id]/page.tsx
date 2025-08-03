"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import SimpleReleaseInfo from "../../components/SimpleReleaseInfo";
import VinylVideos from "../../components/VinylVideos";
import VinylComments from "../../components/VinylComments";
import PageLoader from "../../components/PageLoader";
import Button from "../../components/Button";
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
  const [showCollectionDetails, setShowCollectionDetails] = useState(true);
  const [showReleaseInfo, setShowReleaseInfo] = useState(true);
  const [showVideos, setShowVideos] = useState(false);
  const [showCommunityReviews, setShowCommunityReviews] = useState(false);
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
    return <PageLoader text="Loading vinyl details..." />;
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
                      <span className={styles.vinylCountry}>
                        {vinyl.country}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Pills */}
              {(vinyl.genre?.length > 0 ||
                discogsDetails?.styles?.length > 0) && (
                <div className={styles.modernGenrePills}>
                  {vinyl.genre?.map((g, idx) => (
                    <span
                      key={`genre-${idx}`}
                      className={styles.modernGenrePill}
                    >
                      {g}
                    </span>
                  ))}
                  {discogsDetails?.styles?.map((s, idx) => (
                    <span
                      key={`style-${idx}`}
                      className={styles.modernGenrePill}
                    >
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
              <div className={styles.actionButtons}>
                <Button
                  href={`/vinyl/${id}/edit`}
                  variant="primary"
                  size="medium"
                >
                  Edit Details
                </Button>
                <Button onClick={handleDelete} variant="danger" size="medium">
                  Delete
                </Button>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  size="medium"
                >
                  ← Back
                </Button>
              </div>

              {/* Streaming Links */}
              <div className={styles.streamingLinks}>
                <span className={styles.streamingLabel}>
                  Find on streaming:
                </span>
                <div className={styles.streamingIcons}>
                  <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(
                      `${vinyl.artist} ${vinyl.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.streamingIcon}
                    title="Search on Spotify"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.567 17.341c-.25.417-.781.55-1.199.3-3.283-2.005-7.416-2.458-12.284-1.347-.474.108-.936-.194-1.044-.668-.108-.474.194-.936.668-1.044 5.323-1.213 9.962-.702 13.592 1.56.418.25.55.781.3 1.199zm1.713-3.815c-.314.52-.985.686-1.505.372-3.757-2.311-9.481-2.98-13.927-1.628-.593.181-1.22-.181-1.401-.774-.181-.593.181-1.22.774-1.401 5.093-1.55 11.426-.814 15.631 1.859.52.314.686.985.372 1.505v.067zm.14-3.967c-4.509-2.677-11.955-2.924-16.261-1.617-.711.215-1.463-.258-1.678-.969-.215-.711.258-1.463.969-1.678 4.946-1.504 13.17-1.215 18.334 1.872.644.323.895 1.076.572 1.72-.323.644-1.076.895-1.72.572l-.216-.108z" />
                    </svg>
                  </a>
                  <a
                    href={`https://music.youtube.com/search?q=${encodeURIComponent(
                      `${vinyl.artist} ${vinyl.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.streamingIcon}
                    title="Search on YouTube Music"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169 1.858-.896 3.433-1.926 4.65-.362.416-.744.811-1.131 1.164-.528.48-1.133.852-1.772 1.062-.657.217-1.357.32-2.063.32-.547 0-1.085-.067-1.603-.184-.543-.123-1.073-.309-1.573-.553-.995-.485-1.848-1.157-2.456-2.003-.291-.405-.536-.838-.738-1.289-.239-.533-.43-1.09-.565-1.664-.27-1.141-.27-2.357 0-3.498.135-.574.326-1.131.565-1.664.202-.451.447-.884.738-1.289.608-.846 1.461-1.518 2.456-2.003.5-.244 1.03-.43 1.573-.553.518-.117 1.056-.184 1.603-.184.706 0 1.406.103 2.063.32.639.21 1.244.582 1.772 1.062.387.353.769.748 1.131 1.164 1.03 1.217 1.757 2.792 1.926 4.65zm-1.636 0c-.146-1.526-.738-2.793-1.546-3.796-.284-.355-.604-.688-.946-.987-.46-.402-.98-.717-1.534-.877-.564-.163-1.157-.25-1.755-.25-.467 0-.925.058-1.369.158-.465.105-.918.264-1.346.472-.851.414-1.574.998-2.089 1.702-.246.337-.451.698-.614 1.076-.193.448-.347.92-.453 1.406-.211.967-.211 1.986 0 2.953.106.486.26.958.453 1.406.163.378.368.739.614 1.076.515.704 1.238 1.288 2.089 1.702.428.208.881.367 1.346.472.444.1.902.158 1.369.158.598 0 1.191-.087 1.755-.25.554-.16 1.074-.475 1.534-.877.342-.299.662-.632.946-.987.808-1.003 1.4-2.27 1.546-3.796z" />
                      <path d="M10.061 8.987L15.515 12l-5.454 3.013V8.987z" />
                    </svg>
                  </a>
                  <a
                    href={`https://music.apple.com/search?term=${encodeURIComponent(
                      `${vinyl.artist} ${vinyl.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.streamingIcon}
                    title="Search on Apple Music"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.135-.277 0-.557.014-.836.025-.275.015-.548.035-.82.06-.544.051-1.085.134-1.619.254-.534.12-1.061.28-1.569.494C12.578 1.04 11.95 1.3 11.365 1.67c-.584.37-1.123.81-1.604 1.323-.24.257-.464.527-.673.808-.21.282-.398.58-.572.888-.347.616-.627 1.28-.831 1.976-.102.347-.18.7-.232 1.057-.051.357-.077.718-.077 1.082 0 .928.13 1.823.373 2.682.243.859.594 1.676 1.038 2.422.444.746.98 1.428 1.596 2.025.616.597 1.31 1.107 2.064 1.518.377.206.773.38 1.18.523.407.143.825.254 1.25.329.212.038.425.065.639.08.214.016.429.018.643.003.429-.03.854-.104 1.269-.218.415-.114.82-.268 1.208-.46.388-.192.761-.42 1.113-.678.352-.259.682-.544.992-.853.155-.155.302-.318.44-.488.139-.17.268-.346.388-.528.24-.364.437-.748.589-1.153.152-.405.258-.827.317-1.265.029-.219.043-.439.043-.66 0-.22-.007-.441-.025-.661-.035-.439-.111-.871-.222-1.29-.111-.42-.262-.825-.446-1.209-.184-.384-.404-.748-.654-1.084-.125-.168-.258-.33-.399-.485-.14-.155-.289-.302-.446-.441-.314-.278-.65-.524-1.002-.738-.352-.214-.721-.396-1.106-.543-.192-.074-.389-.138-.588-.193-.2-.055-.402-.1-.606-.133-.408-.066-.82-.099-1.235-.099-.207 0-.415.009-.622.025-.207.017-.413.041-.617.073-.409.064-.814.157-1.207.277-.393.12-.776.268-1.142.442-.183.087-.361.181-.533.282-.172.101-.338.209-.497.323-.318.228-.617.478-.895.749-.278.271-.534.563-.766.872-.116.155-.224.316-.324.482-.1.166-.192.337-.275.513-.166.352-.302.718-.405 1.097-.051.189-.093.381-.127.574-.034.193-.059.388-.075.583-.032.39-.032.783 0 1.174.016.195.041.39.075.583.034.193.076.385.127.574.103.379.239.745.405 1.097.083.176.175.347.275.513.1.166.208.327.324.482.232.309.488.601.766.872.278.271.577.521.895.749.159.114.325.222.497.323.172.101.35.195.533.282.366.174.749.322 1.142.442.393.12.798.213 1.207.277.204.032.41.056.617.073.207.016.415.025.622.025.415 0 .827-.033 1.235-.099.204-.033.406-.078.606-.133.199-.055.396-.119.588-.193.385-.147.754-.329 1.106-.543.352-.214.688-.46 1.002-.738.157-.139.306-.286.446-.441.141-.155.274-.317.399-.485.25-.336.47-.7.654-1.084.184-.384.335-.789.446-1.209.111-.419.187-.851.222-1.29.018-.22.025-.441.025-.661 0-.221-.014-.441-.043-.66-.059-.438-.165-.86-.317-1.265-.152-.405-.349-.789-.589-1.153-.12-.182-.249-.358-.388-.528-.138-.17-.285-.333-.44-.488-.31-.309-.64-.594-.992-.853-.352-.258-.725-.486-1.113-.678-.388-.192-.793-.346-1.208-.46-.415-.114-.84-.188-1.269-.218-.214-.015-.429-.013-.643.003-.214.015-.427.042-.639.08-.425.075-.843.186-1.25.329-.407.143-.803.317-1.18.523-.754.411-1.448.921-2.064 1.518-.616.597-1.152 1.279-1.596 2.025-.444.746-.795 1.563-1.038 2.422-.243.859-.373 1.754-.373 2.682 0 .364.026.725.077 1.082.051.357.13.71.232 1.057.204.696.484 1.36.831 1.976.174.308.362.606.572.888.209.281.433.551.673.808.481.513 1.02.953 1.604 1.323.585.37 1.213.63 1.927.808.508.214 1.035.374 1.569.494.534.12 1.075.203 1.619.254.272.025.545.045.82.06.279.011.559.025.836.025.526 0 1.047-.042 1.564-.135.673-.121 1.303-.353 1.877-.727 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19z" />
                      <path d="M12.2 9.9c-.2 0-.4.2-.4.4v6.4c0 .2.2.4.4.4h2.4c.2 0 .4-.2.4-.4v-2.4h2c1.1 0 2-.9 2-2s-.9-2-2-2h-4.8zm3.2 2.8h-1.6v-1.6h1.6c.4 0 .8.4.8.8s-.4.8-.8.8z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Status Buttons */}
              {vinyl.discogsId && (
                <div className={styles.statusButtons}>
                  <Button
                    onClick={() => handleStatusChange("want")}
                    variant={userStatus === "want" ? "primary" : "outline"}
                    size="medium"
                  >
                    {userStatus === "want" ? "★ In Wantlist" : "Want"}
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("have")}
                    variant={userStatus === "have" ? "primary" : "outline"}
                    size="medium"
                  >
                    {userStatus === "have" ? "✓ Have" : "Mark as Have"}
                  </Button>
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
              <h3
                onClick={() => setShowCollectionDetails(!showCollectionDetails)}
                className={styles.toggleHeader}
              >
                Collection Details{" "}
                <span className={styles.toggleIcon}>
                  {showCollectionDetails ? "−" : "+"}
                </span>
              </h3>
              {showCollectionDetails && (
                <div className={styles.infoGrid}>
                  {vinyl.collection && (
                    <div>
                      <strong>Collection:</strong> {vinyl.collection.title}
                    </div>
                  )}
                  {vinyl.condition && (
                    <div>
                      <strong>Media:</strong> {vinyl.condition}
                    </div>
                  )}
                  {vinyl.sleeveCondition && (
                    <div>
                      <strong>Sleeve:</strong> {vinyl.sleeveCondition}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Personal Notes */}
          {vinyl.description && (
            <div className={styles.infoSection}>
              <h3
                onClick={() => setShowPersonalNotes(!showPersonalNotes)}
                className={styles.toggleHeader}
              >
                Personal Notes{" "}
                <span className={styles.toggleIcon}>
                  {showPersonalNotes ? "−" : "+"}
                </span>
              </h3>
              {showPersonalNotes && (
                <div className={styles.notesContent}>{vinyl.description}</div>
              )}
            </div>
          )}

          {/* Release Info */}
          {discogsDetails && (
            <div className={styles.infoSection}>
              <h3
                onClick={() => setShowReleaseInfo(!showReleaseInfo)}
                className={styles.toggleHeader}
              >
                Release Information{" "}
                <span className={styles.toggleIcon}>
                  {showReleaseInfo ? "−" : "+"}
                </span>
              </h3>
              {showReleaseInfo && (
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
              )}
            </div>
          )}

          {/* Videos */}
          {discogsDetails?.videos && discogsDetails.videos.length > 0 && (
            <div className={styles.infoSection}>
              <h3
                onClick={() => setShowVideos(!showVideos)}
                className={styles.toggleHeader}
              >
                Videos{" "}
                <span className={styles.toggleIcon}>
                  {showVideos ? "−" : "+"}
                </span>
              </h3>
              {showVideos && <VinylVideos videos={discogsDetails.videos} />}
            </div>
          )}

          {/* Comments */}
          {vinyl.discogsId && (
            <div className={styles.infoSection}>
              <h3
                onClick={() => setShowCommunityReviews(!showCommunityReviews)}
                className={styles.toggleHeader}
              >
                Community Reviews{" "}
                <span className={styles.toggleIcon}>
                  {showCommunityReviews ? "−" : "+"}
                </span>
              </h3>
              {showCommunityReviews && (
                <VinylComments discogsId={vinyl.discogsId} />
              )}
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
