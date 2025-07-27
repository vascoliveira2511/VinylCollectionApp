"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import VinylCard from "./components/VinylCard";
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
  recordsPerPage: any;
  displayView: any;
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
  const [filterArtist, setFilterArtist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState(20);
  const [displayView, setDisplayView] = useState("grid");

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile with caching
        const userData = (await apiClient.getCurrentUser()) as UserProfile;
        setUserProfile(userData as UserProfile);

        // Set user preferences
        if (userData.displayView) {
          setDisplayView(userData.displayView);
        }
        if (userData.recordsPerPage) {
          setDisplayLimit(userData.recordsPerPage);
        }

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

  const filteredVinyls = vinyls
    .filter((vinyl) => {
      const matchesArtist =
        filterArtist === "" ||
        vinyl.artist.toLowerCase().includes(filterArtist.toLowerCase());
      const matchesTitle =
        filterTitle === "" ||
        vinyl.title.toLowerCase().includes(filterTitle.toLowerCase());
      const matchesGenre =
        filterGenre === "" ||
        vinyl.genre.some((g) =>
          g.toLowerCase().includes(filterGenre.toLowerCase())
        );
      const matchesYear =
        filterYear === "" || vinyl.year.toString().includes(filterYear);
      return matchesArtist && matchesTitle && matchesGenre && matchesYear;
    })
    .slice(0, displayLimit);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Loading...</div>
            <div className={styles.contentSection}>
              <p>Loading your vinyl collection...</p>
            </div>
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
      <div className="container">
        <div className="window">
          <div className="title-bar">
            Your Vinyl Collection
          </div>
          <div className={styles.contentSection}>
            <div className={styles.browseIntro}>
              <h2>
                Your Vinyl Records ({vinyls.length} total)
              </h2>
              <p>
                Browse, filter, and manage your entire vinyl collection. 
                Click any record to view details or edit information.
              </p>
              <div className={styles.browseActions}>
                <Link href="/browse" className={styles.addButton}>
                  Discover Music
                </Link>
                <Link href="/collections" className={styles.manageButton}>
                  Manage Collections
                </Link>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.filterSection}>
              <h3>Filter Records</h3>
              <div className={styles.filters}>
                <input
                  type="text"
                  placeholder="Filter by Artist"
                  value={filterArtist}
                  onChange={(e) => setFilterArtist(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Filter by Title"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Filter by Genre"
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Filter by Year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                />
                <select
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                >
                  <option value="all">All Collections</option>
                  {collections.map((collection) => (
                    <option
                      key={collection.id}
                      value={collection.id.toString()}
                    >
                      {collection.title} ({collection._count.vinyls})
                    </option>
                  ))}
                </select>
                <select
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                >
                  <option value={12}>Show 12</option>
                  <option value={20}>Show 20</option>
                  <option value={24}>Show 24</option>
                  <option value={48}>Show 48</option>
                  <option value={vinyls.length}>Show All</option>
                </select>
                <select
                  value={displayView}
                  onChange={(e) => setDisplayView(e.target.value)}
                  title="View Type (from your preferences)"
                >
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                  <option value="compact">Compact View</option>
                </select>
              </div>
            </div>

            <div
              className={
                displayView === "list"
                  ? styles.collectionList
                  : displayView === "compact"
                  ? styles.collectionCompact
                  : styles.collectionGrid
              }
            >
              {filteredVinyls.map((vinyl) => (
                <VinylCard
                  key={vinyl.id}
                  vinyl={vinyl}
                  showDetails={true}
                  onEdit={() => {}}
                  onDelete={() => deleteVinyl(vinyl.id)}
                />
              ))}
            </div>

            {filteredVinyls.length === 0 && (
              <div className={styles.emptyState}>
                <p>
                  No vinyl records found. Try adjusting your filters or{" "}
                  <Link href="/browse">discover music</Link> to add to your
                  collection!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
