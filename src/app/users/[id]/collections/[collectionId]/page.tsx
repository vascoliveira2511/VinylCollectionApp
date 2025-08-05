"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from "../../../../components/PageLoader";
import Avatar from "../../../../components/Avatar";
import VinylCard from "../../../../components/VinylCard";
import Button from "../../../../components/Button";
import styles from "../../../../page.module.css";

interface User {
  id: number;
  username: string;
  avatar?: string;
  avatarType?: string;
}

interface Vinyl {
  id: number;
  artist: string;
  title: string;
  year?: number;
  imageUrl?: string;
  genre: string[];
  discogsId?: number;
  createdAt: string;
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
  isPublic: boolean;
  createdAt: string;
  vinyls: Vinyl[];
  user: User;
  _count: {
    vinyls: number;
  };
}

export default function FriendCollectionPage({
  params,
}: {
  params: { id: string; collectionId: string };
}) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states - same as your collections page
  const [filterArtist, setFilterArtist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);
  
  const router = useRouter();

  useEffect(() => {
    fetchCollection();
  }, [params.id, params.collectionId]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/users/${params.id}/collections/${params.collectionId}`
      );

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          setError("You are not authorized to view this collection");
          return;
        }
        if (res.status === 404) {
          setError("Collection not found");
          return;
        }
        throw new Error("Failed to fetch collection");
      }

      const data = await res.json();
      setCollection(data);
    } catch (error) {
      console.error("Error fetching collection:", error);
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic - same as your collections page
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
            filterYear === "" || (vinyl.year && vinyl.year.toString().includes(filterYear));
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
              <Button href={`/users/${params.id}`} variant="outline" size="medium">
                ← Back to Profile
              </Button>
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
                  </h1>
                  {collection.description && (
                    <p className={styles.collectionPageDescription}>
                      {collection.description}
                    </p>
                  )}
                  {/* Friend's Collection Owner Info */}
                  <div className={styles.ownerSection}>
                    <Avatar
                      username={collection.user.username}
                      avatar={collection.user.avatar}
                      avatarType={collection.user.avatarType}
                      size="small"
                    />
                    <span className={styles.ownerText}>
                      by {collection.user.username}
                    </span>
                  </div>
                </div>
                <div className={styles.collectionStats}>
                  <span className={styles.recordCount}>
                    {collection.vinyls.length} record{collection.vinyls.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className={styles.collectionHeroActions}>
                <Button href={`/users/${params.id}`} variant="outline" size="medium">
                  ← Back to {collection.user.username}'s Profile
                </Button>
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
              <p className={styles.friendCollectionNote}>
                Viewing {collection.user.username}'s collection
              </p>
            </div>
            {filteredVinyls.length > 0 ? (
              <div className={styles.modernCollectionGrid}>
                {filteredVinyls.map((vinyl) => (
                  <VinylCard
                    key={vinyl.id}
                    vinyl={vinyl}
                    showDetails={true}
                    showActions={false}
                    linkPrefix="/browse"
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
                      This collection is empty.
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