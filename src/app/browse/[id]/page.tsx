"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import PageLoader from "../../components/PageLoader";
import SimpleReleaseInfo from "../../components/SimpleReleaseInfo";
import VinylVideos from "../../components/VinylVideos";
import VinylComments from "../../components/VinylComments";
import StatusButtons from "../../components/StatusButtons";
import Button from "../../components/Button";
import AddToCollectionButton from "../../components/AddToCollectionButton";
import SpotifyPreview from "../../components/SpotifyPreview";
import RecommendationsSection from "../../components/RecommendationsSection";
import { SiSpotify, SiYoutube, SiApplemusic } from "react-icons/si";
import styles from "../../page.module.css";

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
  // Additional detailed fields
  master_id: number;
  master_url: string;
  data_quality: string;
  status: string;
  community: {
    rating: {
      average: number;
      count: number;
    };
    have: number;
    want: number;
    contributors: Array<{
      username: string;
      resource_url: string;
    }>;
  };
  identifiers: Array<{
    type: string;
    value: string;
    description?: string;
  }>;
  extraartists: Array<{
    name: string;
    id: number;
    role: string;
    tracks: string;
  }>;
  date_added: string;
  date_changed: string;
}

export default function BrowseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [release, setRelease] = useState<DiscogsRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReleaseInfo, setShowReleaseInfo] = useState(true);
  const [showVideos, setShowVideos] = useState(false);
  const [showCommunityReviews, setShowCommunityReviews] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [existingVinyls, setExistingVinyls] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [releaseData, collectionsData] = await Promise.all([
          apiClient.getDiscogsRelease(id),
          apiClient.getCollections(),
        ]);

        setRelease(releaseData as DiscogsRelease);
        setCollections(collectionsData as any[]);

        // Check if this vinyl already exists in any collection
        try {
          const existingResponse = await fetch(
            `/api/vinyl/check-exists?discogsId=${id}`
          );
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            setExistingVinyls(existingData);
          }
        } catch (existingErr) {
          console.log("Could not check existing vinyls:", existingErr);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load release details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const addToCollection = async (collectionId?: number) => {
    if (!release) return;

    // Check if vinyl already exists in this collection
    const existingInCollection = existingVinyls.find((v) =>
      collectionId ? v.collectionId === collectionId : v.collection?.isDefault
    );

    if (existingInCollection) {
      const collectionName = collectionId
        ? collections.find((c) => c.id === collectionId)?.title || "collection"
        : "your collection";

      if (
        confirm(
          `This vinyl already exists in ${collectionName}. Would you like to view it instead?`
        )
      ) {
        if (collectionId) {
          router.push(
            `/collections/${collectionId}?highlight=${existingInCollection.id}`
          );
        } else {
          router.push(`/?highlight=${existingInCollection.id}`);
        }
      }
      return;
    }

    setAddingToCollection(true);
    try {
      const response = await apiClient.addVinyl({
        artist: release.artists?.[0]?.name || "Unknown Artist",
        title: release.title,
        year: release.year || null,
        imageUrl:
          release.images?.[0]?.uri500 || release.images?.[0]?.uri || null,
        genre: release.genres || [],
        discogsId: release.id,
        label: release.labels?.[0]?.name || null,
        format: release.formats?.[0]?.name || null,
        country: release.country || null,
        catalogNumber: release.labels?.[0]?.catno || null,
        ...(collectionId && { collectionId }),
      });

      // Redirect to the collection page
      if (collectionId) {
        router.push(`/collections/${collectionId}?highlight=${response.id}`);
      } else {
        // Redirect to main collection page
        router.push(`/?highlight=${response.id}`);
      }
    } catch (err) {
      alert(
        "Failed to add to collection: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setAddingToCollection(false);
    }
  };

  const addToWantlist = async () => {
    if (!release) return;

    try {
      const response = await fetch("/api/vinyl-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discogsId: release.id,
          status: "want",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Find wantlist collection and redirect to it with highlight
        const wantlistCollection = collections.find(
          (c) => c.type === "wantlist"
        );
        if (wantlistCollection && data.vinyl?.id) {
          router.push(
            `/collections/${wantlistCollection.id}?highlight=${data.vinyl.id}`
          );
        } else if (wantlistCollection) {
          router.push(`/collections/${wantlistCollection.id}`);
        } else {
          // Fallback to collections page
          router.push("/collections");
        }
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to add to wantlist"));
      }
    } catch (err) {
      alert(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return <PageLoader text="Loading release details..." />;
  }

  if (error || !release) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.errorState}>
                <p>Error: {error || "Release not found"}</p>
                <Button href="/browse" variant="outline" size="medium">
                  ← Back to Browse
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Get the best available image - priority: Discogs high-res
  const displayImages =
    release?.images && release.images.length > 0 ? release.images : [];

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
                <div className={styles.imageNavContainer}>
                  <div className={styles.mainAlbumCover}>
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(
                        currentImage.uri500 || currentImage.uri
                      )}`}
                      alt={`${release.title} cover`}
                      className={styles.coverImage}
                    />
                    {displayImages.length > 1 && (
                      <>
                        <button
                          className={`${styles.imageNavButton} ${styles.imageNavPrev}`}
                          onClick={() =>
                            setSelectedImage(
                              (prev) =>
                                (prev - 1 + displayImages.length) %
                                displayImages.length
                            )
                          }
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          className={`${styles.imageNavButton} ${styles.imageNavNext}`}
                          onClick={() =>
                            setSelectedImage(
                              (prev) => (prev + 1) % displayImages.length
                            )
                          }
                          aria-label="Next image"
                        >
                          ›
                        </button>
                        <div className={styles.imageCounter}>
                          {selectedImage + 1} / {displayImages.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vinyl Info */}
            <div className={styles.vinylHeroInfo}>
              <div className={styles.vinylTitleSection}>
                <h1 className={styles.modernVinylTitle}>{release.title}</h1>
                <h2 className={styles.modernVinylArtist}>
                  {release.artists?.map((a) => a.name).join(", ") ||
                    "Unknown Artist"}
                </h2>
                <div className={styles.vinylMetaInfo}>
                  <span className={styles.vinylYear}>{release.year}</span>
                  {release.country && (
                    <>
                      <span className={styles.metaSeparator}>•</span>
                      <span className={styles.vinylCountry}>
                        {release.country}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Pills */}
              {(release.genres?.length > 0 || release.styles?.length > 0) && (
                <div className={styles.modernGenrePills}>
                  {release.genres?.map((g, idx) => (
                    <span
                      key={`genre-${idx}`}
                      className={styles.modernGenrePill}
                    >
                      {g}
                    </span>
                  ))}
                  {release.styles?.map((s, idx) => (
                    <span
                      key={`style-${idx}`}
                      className={styles.modernGenrePill}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <div className={styles.collectionButtonWrapper}>
                  <AddToCollectionButton
                    collections={collections}
                    onAdd={addToCollection}
                    onAddToWantlist={addToWantlist}
                    disabled={addingToCollection}
                    existingVinyls={existingVinyls}
                  />
                </div>
                <Button href="/browse" variant="outline" size="medium">
                  ← Back to Browse
                </Button>
              </div>

              {/* Spotify Preview */}
              <SpotifyPreview
                artist={
                  release.artists?.map((a) => a.name).join(", ") ||
                  "Unknown Artist"
                }
                album={release.title}
                year={release.year}
              />

              {/* Streaming Links */}
              <div className={styles.streamingLinks}>
                <span className={styles.streamingLabel}>
                  Find on streaming:
                </span>
                <div className={styles.streamingButtons}>
                  <a
                    href={`https://music.youtube.com/search?q=${encodeURIComponent(
                      `${
                        release.artists?.map((a) => a.name).join(", ") || ""
                      } ${release.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.streamingButton}
                    style={{ backgroundColor: "#FF0000", color: "white" }}
                    title="Search on YouTube Music"
                  >
                    <SiYoutube size={16} style={{ marginRight: "6px" }} />
                    YouTube
                  </a>
                  <a
                    href={`https://music.apple.com/search?term=${encodeURIComponent(
                      `${
                        release.artists?.map((a) => a.name).join(", ") || ""
                      } ${release.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.streamingButton}
                    style={{ backgroundColor: "#FA243C", color: "white" }}
                    title="Search on Apple Music"
                  >
                    <SiApplemusic size={16} style={{ marginRight: "6px" }} />
                    Apple Music
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info - Simplified */}
        <div className={styles.vinylSimpleContent}>
          {/* Release Info */}
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
                labels={release.labels}
                formats={release.formats}
                released={release.released}
                master_id={release.master_id}
                country={release.country}
                companies={release.companies}
                extraartists={release.extraartists}
                identifiers={release.identifiers}
                tracklist={release.tracklist}
                notes={release.notes}
              />
            )}
          </div>

          {/* Videos */}
          {release?.videos && release.videos.length > 0 && (
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
              {showVideos && <VinylVideos videos={release.videos} />}
            </div>
          )}

          {/* Comments */}
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
            {showCommunityReviews && <VinylComments discogsId={release.id} />}
          </div>

          {/* External Link */}
          {release?.uri && (
            <div className={styles.infoSection}>
              <a
                href={release.uri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.discogsLink}
              >
                View on Discogs →
              </a>
            </div>
          )}

          {/* Recommendations */}
          <RecommendationsSection
            discogsId={release.id.toString()}
            masterId={release.master_id?.toString()}
          />
        </div>
      </div>
    </main>
  );
}
