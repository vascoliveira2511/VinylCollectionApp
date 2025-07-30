"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import VinylCard from "./components/VinylCard";
import LoadingSpinner from "./components/LoadingSpinner";
import Button from "./components/Button";
import styles from "./page.module.css";

interface Vinyl {
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
  // New manual fields
  trackList?: string[];
  description?: string;
  label?: string;
  format?: string;
  condition?: string;
  rating?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseLocation?: string;
  catalogNumber?: string;
  country?: string;
}

interface Collection {
  id: number;
  title: string;
  description?: string;
  isDefault: boolean;
  _count: {
    vinyls: number;
  };
}

interface UserProfile {
  username: string;
  totalRecords: number;
  genreStats: Record<string, number>;
  recentVinyls: Vinyl[];
}

export default function Home() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterGenre, setFilterGenre] = useState("");
  const [filterCollection, setFilterCollection] = useState<string>("all");

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile with caching
        const userData = (await apiClient.getCurrentUser()) as UserProfile;
        setUserProfile(userData as UserProfile);

        // Fetch collections with caching
        const collectionsData =
          (await apiClient.getCollections()) as Collection[];
        setCollections(collectionsData);

        // Fetch vinyls
        await fetchVinyls();
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchVinyls = async (collectionFilter?: string) => {
    try {
      const filters: Record<string, string> = {};
      if (collectionFilter && collectionFilter !== "all") {
        filters.collectionId = collectionFilter;
      }

      const vinylsData = (await apiClient.getVinylCollection(
        filters
      )) as Vinyl[];
      setVinyls(vinylsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  useEffect(() => {
    if (collections.length > 0) {
      fetchVinyls(filterCollection);
    }
  }, [filterCollection, collections]);

  const deleteVinyl = async (id: number) => {
    try {
      setError(null);
      await apiClient.deleteVinyl(id.toString());

      // Refresh data with cache invalidation
      const [vinylsData, userData] = await Promise.all([
        apiClient.getVinylCollection({}, { cache: "force-refresh" }) as Promise<
          Vinyl[]
        >,
        apiClient.getCurrentUser({ cache: "force-refresh" }),
      ]);

      setVinyls(vinylsData);
      setUserProfile(userData as UserProfile);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className="content-wrapper">
            <LoadingSpinner
              size="large"
              text="Loading Your Vinyl Universe..."
            />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Error</div>
            <div className={styles.contentSection}>
              <p style={{ color: "var(--ctp-red)" }}>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className="content-wrapper">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Your Vinyl Universe</h1>
            <p className={styles.heroSubtitle}>
              Discover, collect, and celebrate the vinyl records that define
              your musical journey
            </p>

            {/* Quick Stats */}
            {userProfile && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {userProfile.totalRecords || 0}
                  </div>
                  <div className={styles.statLabel}>Total Records</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {userProfile.genreStats
                      ? Object.keys(userProfile.genreStats).length
                      : 0}
                  </div>
                  <div className={styles.statLabel}>Genres</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {collections?.length || 0}
                  </div>
                  <div className={styles.statLabel}>Collections</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {userProfile.recentVinyls?.length || 0}
                  </div>
                  <div className={styles.statLabel}>Recent Adds</div>
                </div>
              </div>
            )}

            <div className={styles.heroActions}>
              <Button href="/browse" variant="primary" size="large">
                Discover Music
              </Button>
              <Button href="/collections" variant="outline" size="large">
                Manage Collections
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added Spotlight */}
      {userProfile?.recentVinyls && userProfile.recentVinyls.length > 0 && (
        <div className={styles.section}>
          <div className="content-wrapper">
            <div className={styles.sectionHeader}>
              <h2>Latest Additions</h2>
              <p>Fresh vinyl just added to your collection</p>
            </div>
            <div className={styles.recentSpotlight}>
              {userProfile.recentVinyls.slice(0, 3).map((vinyl, index) => (
                <div
                  key={`recent-${vinyl.id}`}
                  className={styles.spotlightCard}
                >
                  <VinylCard
                    vinyl={vinyl}
                    showDetails={true}
                    onEdit={() => {}}
                    onDelete={() => deleteVinyl(vinyl.id)}
                    priority={index === 0}
                  />
                  <div className={styles.spotlightBadge}>New</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {userProfile &&
        (!userProfile.recentVinyls || userProfile.recentVinyls.length === 0) &&
        userProfile.totalRecords === 0 && (
          <div className={styles.section}>
            <div className="content-wrapper">
              <div className={styles.emptyHero}>
                <h2>Start Your Vinyl Journey</h2>
                <p>
                  Your collection is waiting to be discovered. Add your first
                  record to get started!
                </p>
                <div className={styles.heroActions}>
                  <Button href="/browse" variant="primary" size="large">
                    Start Collecting
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Genre Overview */}
      {userProfile?.genreStats &&
        Object.keys(userProfile.genreStats).length > 0 && (
          <div className={styles.section}>
            <div className="content-wrapper">
              <div className={styles.sectionHeader}>
                <h2>Your Musical DNA</h2>
                <p>Genre breakdown of your collection</p>
              </div>
              <div className={styles.genreGrid}>
                {Object.entries(userProfile.genreStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([genre, count]) => (
                    <Link
                      key={genre}
                      href={`/collections?genre=${encodeURIComponent(genre)}`}
                      className={styles.genreCard}
                    >
                      <div className={styles.genreName}>{genre}</div>
                      <div className={styles.genreCount}>{count} records</div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}

      {/* Collection Preview Section */}
      {vinyls.length > 0 && (
        <div className={styles.section} data-collection-section>
          <div className="content-wrapper">
            <div className={styles.sectionHeader}>
              <h2>Collection Overview</h2>
              <p>Explore the highlights from your vinyl collection</p>
            </div>

            <div className={styles.collectionPreview}>
              {vinyls.slice(0, 8).map((vinyl, index) => (
                <VinylCard
                  key={`preview-${vinyl.id}`}
                  vinyl={vinyl}
                  showDetails={false}
                  onEdit={() => {}}
                  onDelete={() => deleteVinyl(vinyl.id)}
                  priority={index < 4}
                />
              ))}
            </div>

            <div className={styles.heroActions}>
              <Button href="/collections" variant="secondary" size="medium">
                View All {userProfile?.totalRecords || vinyls.length} Records →
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
