"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import VinylCard from "../../components/VinylCard";
import PageLoader from "../../components/PageLoader";
import Button from "../../components/Button";
import styles from "../../page.module.css";

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
  // Additional metadata fields
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
  createdAt: string;
  vinyls: Vinyl[];
  _count: {
    vinyls: number;
  };
}

export default function CollectionView({ params }: { params: { id: string } }) {
  const { id } = params;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterArtist, setFilterArtist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);

  const router = useRouter();

  const fetchCollection = async () => {
    try {
      const data = await apiClient.getCollection(id);
      setCollection(data as Collection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (id) {
      fetchCollection();
    }
  }, [id, router]);

  const filteredVinyls = collection
    ? collection.vinyls
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
        .slice(0, displayLimit)
    : [];

  if (loading) {
    return <PageLoader text="Loading collection..." />;
  }

  if (error || !collection) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.contentSection}>
            <div className={styles.errorState}>
              <p className={styles.errorMessage}>
                {error || "Collection not found"}
              </p>
              <Link href="/collections">
                <Button variant="outline" size="medium">
                  Back to Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          {/* Collection Hero Section */}
          <div className={styles.collectionHeroSection}>
            <div className={styles.collectionHeroContent}>
              <div className={styles.collectionHeroLeft}>
                <div className={styles.collectionTitleSection}>
                  <h1 className={styles.collectionPageTitle}>
                    {collection.title}
                    {collection.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </h1>
                  {collection.description && (
                    <p className={styles.collectionPageDescription}>
                      {collection.description}
                    </p>
                  )}
                </div>
                <div className={styles.collectionStats}>
                  <span className={styles.recordCount}>
                    {collection._count.vinyls} record{collection._count.vinyls !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className={styles.collectionHeroActions}>
                <Link href="/collections">
                  <Button variant="outline" size="medium">
                    ← Back to Collections
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Modern Filters Section */}
          {collection.vinyls.length > 0 && (
            <div className={styles.filtersSection}>
              <div className={styles.filtersHeader}>
                <h2 className={styles.sectionTitle}>Filter & View</h2>
              </div>
              <div className={styles.modernFilters}>
                <div className={styles.filterInputs}>
                  <input
                    type="text"
                    placeholder="Search by artist..."
                    value={filterArtist}
                    onChange={(e) => setFilterArtist(e.target.value)}
                    className={styles.modernFilterInput}
                  />
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className={styles.modernFilterInput}
                  />
                  <input
                    type="text"
                    placeholder="Filter by genre..."
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className={styles.modernFilterInput}
                  />
                  <input
                    type="number"
                    placeholder="Year..."
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className={styles.modernFilterInput}
                  />
                </div>
                <div className={styles.viewControls}>
                  <select
                    value={displayLimit}
                    onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                    className={styles.modernSelect}
                  >
                    <option value={12}>Show 12</option>
                    <option value={24}>Show 24</option>
                    <option value={48}>Show 48</option>
                    <option value={collection.vinyls.length}>Show All</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Records Section */}
          <div className={styles.recordsSection}>
            <div className={styles.recordsHeader}>
              <h2 className={styles.sectionTitle}>
                Records <span className={styles.recordCountBadge}>({filteredVinyls.length})</span>
              </h2>
            </div>
            {filteredVinyls.length > 0 ? (
              <div className={styles.modernCollectionGrid}>
                {filteredVinyls.map((vinyl) => (
                  <VinylCard
                    key={vinyl.id}
                    vinyl={vinyl}
                    showDetails={true}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.modernEmptyState}>
                <div className={styles.emptyStateIcon}>🎵</div>
                {collection.vinyls.length === 0 ? (
                  <>
                    <h3 className={styles.emptyStateTitle}>No records yet</h3>
                    <p className={styles.emptyStateDescription}>
                      This collection is empty. Add some records to get started!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className={styles.emptyStateTitle}>No matches found</h3>
                    <p className={styles.emptyStateDescription}>
                      No records match your current filters. Try adjusting your search.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
