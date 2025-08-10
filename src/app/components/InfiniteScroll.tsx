"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import VinylCard from "./VinylCard";
import LoadingSpinner from "./LoadingSpinner";
import styles from "./InfiniteScroll.module.css";

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

interface InfiniteScrollProps {
  vinyls: Vinyl[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
  itemsPerPage?: number;
}

export default function InfiniteScroll({
  vinyls,
  hasMore,
  loading,
  onLoadMore,
  onDelete,
  showActions = true,
  itemsPerPage = 20,
}: InfiniteScrollProps) {
  const [displayedVinyls, setDisplayedVinyls] = useState<Vinyl[]>([]);
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update displayed vinyls when vinyls prop changes
  useEffect(() => {
    setDisplayedVinyls(vinyls);
  }, [vinyls]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    if (loadingRef.current) {
      observerRef.current = new IntersectionObserver(handleObserver, {
        threshold: 0.1,
        rootMargin: "100px",
      });
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  if (displayedVinyls.length === 0 && !loading) {
    return (
      <div className={styles.emptyState}>
        <h3>No records found</h3>
        <p>Try adjusting your search filters or add some vinyl to your collection.</p>
      </div>
    );
  }

  return (
    <div className={styles.infiniteScroll}>
      <div className={styles.vinylGrid}>
        {displayedVinyls.map((vinyl, index) => (
          <VinylCard
            key={`${vinyl.id}-${index}`}
            vinyl={vinyl}
            showDetails={true}
            showActions={showActions}
            onDelete={onDelete}
            priority={index < 8}
          />
        ))}
      </div>

      {/* Loading trigger for infinite scroll */}
      <div ref={loadingRef} className={styles.loadingTrigger}>
        {loading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
            <span>Loading more records...</span>
          </div>
        )}
      </div>

      {/* End of results indicator */}
      {!hasMore && displayedVinyls.length > 0 && (
        <div className={styles.endMessage}>
          <p>You've reached the end of your collection!</p>
          <p>{displayedVinyls.length} records total</p>
        </div>
      )}
    </div>
  );
}