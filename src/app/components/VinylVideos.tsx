"use client";

import { useState } from "react";
import styles from "../page.module.css";

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
    <div className="window" style={{ marginBottom: "20px" }}>
      <div
        className="title-bar"
        style={{ cursor: "pointer" }}
        onClick={() => setShowVideos(!showVideos)}
      >
        Videos ({videos.length}) {showVideos ? "▲" : "▼"}
      </div>
      {showVideos && (
        <div className={styles.contentSection}>
          <div style={{ display: "grid", gap: "12px" }}>
            {videos.map((video, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "10px",
                  backgroundColor: "var(--ctp-surface0)",
                  borderRadius: "6px",
                  fontSize: "0.85em",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.9em" }}>{video.title}</strong>
                  {video.description && (
                    <p
                      style={{
                        margin: "4px 0",
                        color: "var(--ctp-subtext1)",
                        fontSize: "0.8em",
                        lineHeight: "1.3",
                      }}
                    >
                      {video.description}
                    </p>
                  )}
                  {video.duration && (
                    <span
                      style={{
                        color: "var(--ctp-subtext1)",
                        fontSize: "0.75em",
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
                    marginLeft: "15px",
                    padding: "6px 12px",
                    backgroundColor: "var(--ctp-mauve)",
                    color: "var(--ctp-crust)",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                    whiteSpace: "nowrap",
                  }}
                >
                  Watch →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
