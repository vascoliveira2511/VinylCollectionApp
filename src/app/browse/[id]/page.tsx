"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import VinylHeader from "../../components/VinylHeader";
import SimpleReleaseInfo from "../../components/SimpleReleaseInfo";
import VinylVideos from "../../components/VinylVideos";
import VinylComments from "../../components/VinylComments";
import TrackList from "../../components/TrackList";
import CollapsibleSection from "../../components/CollapsibleSection";
import StatusButtons from "../../components/StatusButtons";
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
  const [showNotes, setShowNotes] = useState(false);
  const [userStatus, setUserStatus] = useState<"want" | "have" | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [releaseData, statusData] = await Promise.all([
          apiClient.getDiscogsRelease(id),
          fetch(`/api/vinyl-status?discogsId=${id}`).then((res) =>
            res.ok ? res.json() : { status: null }
          ),
        ]);

        setRelease(releaseData as DiscogsRelease);
        setUserStatus(statusData.status);
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

  const addToCollection = async () => {
    if (!release) return;

    setAddingToCollection(true);
    try {
      await apiClient.addVinyl({
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
      });

      alert(
        `"${release.title}" by ${release.artists?.[0]?.name} added to your collection!`
      );
    } catch (err) {
      alert(
        "Failed to add to collection: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setAddingToCollection(false);
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
                <p>Loading release details...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !release) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <div className={styles.errorState}>
                <p>❌ {error || "Release not found"}</p>
                <Link href="/browse" className={styles.backButton}>
                  ← Back to Browse
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
      <VinylHeader
        title={release.title}
        artist={release.artists?.map((a) => a.name) || []}
        year={release.year}
        country={release.country}
        genres={release.genres}
        images={release.images}
        showBackground={true}
        actions={
          <>
            <button
              onClick={addToCollection}
              disabled={addingToCollection}
              className={styles.addToCollectionButton}
            >
              {addingToCollection ? "⏳ Adding..." : "➕ Add to Collection"}
            </button>

            <StatusButtons
              discogsId={release.id}
              onStatusChange={(status) => setUserStatus(status)}
            />

            <Link href="/browse" className={styles.backButton}>
              ← Back to Browse
            </Link>
          </>
        }
      />

      <div className="container">
        <div className="window">
          <div className={styles.contentSection}>
            {/* Community Status Section */}
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
                🎵 Your Status
              </div>
              <div className={styles.contentSection}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    fontSize: "0.9em",
                  }}
                >
                  <div>
                    <strong>Collection Status:</strong>
                    <div style={{ marginTop: "5px" }}>
                      {userStatus === "want" && (
                        <span style={{ color: "var(--ctp-red)" }}>
                          ❤️ In Wantlist
                        </span>
                      )}
                      {userStatus === "have" && (
                        <span style={{ color: "var(--ctp-green)" }}>
                          ✅ Have
                        </span>
                      )}
                      {!userStatus && (
                        <span style={{ color: "var(--ctp-subtext1)" }}>
                          Not in your collection
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Community:</strong>
                    <div
                      style={{
                        marginTop: "5px",
                        color: "var(--ctp-subtext1)",
                        fontSize: "0.85em",
                      }}
                    >
                      Community reviews and comments available below
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="window" style={{ marginBottom: "20px" }}>
              <div className={styles.contentSection}>
                <SimpleReleaseInfo
                  labels={release.labels}
                  formats={release.formats}
                  released={release.released}
                  companies={release.companies}
                  extraartists={release.extraartists}
                  identifiers={release.identifiers}
                  master_id={release.master_id}
                  country={release.country}
                  tracklist={release.tracklist}
                  notes={release.notes}
                />
              </div>
            </div>

            <VinylVideos videos={release.videos || []} />

            <VinylComments discogsId={release.id} />

            {/* External Links */}
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <a
                href={release.uri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                View on Discogs →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
