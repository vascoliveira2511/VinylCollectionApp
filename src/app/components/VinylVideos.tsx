"use client";

import { useState } from "react";

interface Video {
  uri: string;
  title: string;
  description?: string;
  duration?: number;
}

interface VinylVideosProps {
  videos: Video[];
}

export default function VinylVideos({ videos }: VinylVideosProps) {
  const [showVideos, setShowVideos] = useState(false);

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 
        style={{ 
          cursor: "pointer", 
          fontSize: "1.2rem", 
          fontWeight: "600", 
          color: "var(--text)", 
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onClick={() => setShowVideos(!showVideos)}
      >
        Videos ({videos.length}) {showVideos ? "▲" : "▼"}
      </h4>
      {showVideos && (
        <div style={{ display: "grid", gap: "12px" }}>
          {videos.map((video, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "1rem", color: "var(--text)" }}>{video.title}</strong>
                {video.description && (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      lineHeight: "1.4",
                    }}
                  >
                    {video.description}
                  </p>
                )}
                {video.duration && (
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.8rem",
                      display: "block",
                      marginTop: "4px"
                    }}
                  >
                    Duration: {Math.floor(video.duration / 60)}:
                    {(video.duration % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
              <a
                href={video.uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: "16px",
                  padding: "8px 16px",
                  background: "var(--beeswax)",
                  color: "var(--text-inverse)",
                  textDecoration: "none",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                  border: "2px solid var(--beeswax)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                Watch →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
