"use client";

import { useState, useEffect } from "react";

// Global cache for Spotify searches (client-side)
const spotifyCache = new Map<
  string,
  { id: string | null; timestamp: number }
>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes client-side cache

// Active request tracking to prevent duplicate API calls
const activeRequests = new Map<string, Promise<string | null>>();

interface SpotifyEmbedProps {
  artist: string;
  album: string;
  year?: number;
}

export default function SpotifyPreview({ artist, album }: SpotifyEmbedProps) {
  const [spotifyId, setSpotifyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpotifyId = async () => {
      if (!artist || !album) {
        setLoading(false);
        return;
      }

      const cacheKey = `${artist.toLowerCase().trim()}:${album
        .toLowerCase()
        .trim()}`;

      // Check cache first
      const cached = spotifyCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Client cache hit for: ${artist} - ${album}`);
        setSpotifyId(cached.id);
        setLoading(false);
        return;
      }

      // Check if there's already an active request for this search
      const existingRequest = activeRequests.get(cacheKey);
      if (existingRequest) {
        console.log(`Deduplicating request for: ${artist} - ${album}`);
        try {
          const result = await existingRequest;
          setSpotifyId(result);
        } catch (err) {
          console.error("Deduplicated request failed:", err);
          setSpotifyId(null);
        }
        setLoading(false);
        return;
      }

      // Create new request
      const requestPromise = (async (): Promise<string | null> => {
        try {
          const response = await fetch(
            `/api/spotify/search?artist=${encodeURIComponent(
              artist
            )}&album=${encodeURIComponent(album)}`
          );

          if (response.ok) {
            const data = await response.json();
            console.log("Spotify album found:", data.id);
            return data.id;
          } else {
            console.log("Album not found on Spotify");
            return null;
          }
        } catch (err) {
          console.error("Spotify fetch error:", err);
          return null;
        }
      })();

      // Store the active request
      activeRequests.set(cacheKey, requestPromise);

      try {
        setLoading(true);
        const result = await requestPromise;

        // Cache the result
        spotifyCache.set(cacheKey, {
          id: result,
          timestamp: Date.now(),
        });

        setSpotifyId(result);
      } catch (err) {
        console.error("Spotify request failed:", err);
        setSpotifyId(null);
      } finally {
        setLoading(false);
        // Remove from active requests
        activeRequests.delete(cacheKey);
      }
    };

    fetchSpotifyId();
  }, [artist, album]);

  // Cleanup old cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      spotifyCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          spotifyCache.delete(key);
        }
      });
    };

    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: "#f0f0f0",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "24px 0",
        }}
      >
        Loading Spotify player...
      </div>
    );
  }

  if (!spotifyId) {
    return null; // Don't show anything if no Spotify album found
  }

  return (
    <div style={{ margin: "24px 0" }}>
      <iframe
        src={`https://open.spotify.com/embed/album/${spotifyId}?utm_source=generator&theme=0`}
        width="100%"
        height="352"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{
          borderRadius: "12px",
        }}
      />
    </div>
  );
}
