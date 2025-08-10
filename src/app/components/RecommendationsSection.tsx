"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../page.module.css";

// Simple request cache to prevent duplicate calls
const requestCache = new Map<string, Promise<any>>();
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface Recommendation {
  id: number;
  title: string;
  artist: string;
  year: number;
  genre: string[];
  style: string[];
  imageUrl?: string;
  thumb: string;
  type: "master" | "release";
  country?: string;
  format?: string;
  label?: string;
}

interface RecommendationsSectionProps {
  discogsId?: string;
  masterId?: string;
}

export default function RecommendationsSection({
  discogsId,
  masterId,
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!discogsId && !masterId) {
        setLoading(false);
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const params = new URLSearchParams();
      if (discogsId) params.append("discogsId", discogsId);
      if (masterId) params.append("masterId", masterId);

      const cacheKey = params.toString();

      // Check client-side cache first
      const cached = dataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setRecommendations(cached.data.recommendations || []);
        setLoading(false);
        return;
      }

      // Check if request is already in flight
      if (requestCache.has(cacheKey)) {
        try {
          const data = await requestCache.get(cacheKey);
          setRecommendations(data.recommendations || []);
          setLoading(false);
          return;
        } catch (err) {
          // Request was cancelled or failed, continue with new request
        }
      }

      try {
        abortControllerRef.current = new AbortController();

        const fetchPromise = fetch(`/api/recommendations?${cacheKey}`, {
          signal: abortControllerRef.current.signal,
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch recommendations");
          }
          return response.json();
        });

        // Store the promise to prevent duplicate requests
        requestCache.set(cacheKey, fetchPromise);

        const data = await fetchPromise;

        // Cache the result
        dataCache.set(cacheKey, { data, timestamp: Date.now() });

        setRecommendations(data.recommendations || []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't show error
          return;
        }
        console.error("Error fetching recommendations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load recommendations"
        );
      } finally {
        requestCache.delete(cacheKey);
        setLoading(false);
      }
    };

    fetchRecommendations();

    // Cleanup function to cancel request if component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [discogsId, masterId]);

  if (loading) {
    return (
      <div className={styles.recommendationsSection}>
        <h3 className={styles.sectionTitle}>Recommendations</h3>
        <div className={styles.recommendationsGrid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.recommendationCardSkeleton}>
              <div className={styles.skeletonImage}></div>
              <div className={styles.skeletonText}></div>
              <div className={styles.skeletonText}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show section if there's an error or no recommendations
  }

  return (
    <div className={styles.recommendationsSection}>
      <h3 className={styles.sectionTitle}>You might also like</h3>
      <div className={styles.recommendationsGrid}>
        {recommendations.slice(0, 12).map((rec) => (
          <Link
            key={rec.id}
            href={`/browse/${rec.id}`}
            className={styles.recommendationCard}
          >
            <div className={styles.recommendationImage}>
              {(rec.imageUrl || rec.thumb) &&
              (rec.imageUrl !== "" || rec.thumb !== "") ? (
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(
                    rec.imageUrl || rec.thumb
                  )}`}
                  alt={`${rec.title} cover`}
                  className={styles.recommendationCover}
                />
              ) : (
                <div className={styles.recommendationPlaceholder}>
                  <div className={styles.vinylIcon}></div>
                </div>
              )}
              <div className={styles.recommendationOverlay}>
                <div className={styles.recommendationInfo}>
                  <h4 className={styles.recommendationTitle}>{rec.title}</h4>
                  <p className={styles.recommendationArtist}>{rec.artist}</p>
                  {rec.year && (
                    <p className={styles.recommendationYear}>{rec.year}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
