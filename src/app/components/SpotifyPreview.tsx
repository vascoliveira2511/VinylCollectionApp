"use client";

import { useState, useEffect } from "react";

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
      try {
        setLoading(true);
        const response = await fetch(`/api/spotify/search?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Spotify album found:", data.id);
          setSpotifyId(data.id);
        } else {
          console.log("Album not found on Spotify");
          setSpotifyId(null);
        }
      } catch (err) {
        console.error("Spotify fetch error:", err);
        setSpotifyId(null);
      } finally {
        setLoading(false);
      }
    };

    if (artist && album) {
      fetchSpotifyId();
    } else {
      setLoading(false);
    }
  }, [artist, album]);

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '200px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '24px 0'
      }}>
        Loading Spotify player...
      </div>
    );
  }

  if (!spotifyId) {
    return null; // Don't show anything if no Spotify album found
  }

  return (
    <div style={{ margin: '24px 0' }}>
      <iframe
        src={`https://open.spotify.com/embed/album/${spotifyId}?utm_source=generator&theme=0`}
        width="100%"
        height="352"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{
          borderRadius: '12px'
        }}
      />
    </div>
  );
}