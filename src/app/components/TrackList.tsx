"use client";

import { useState } from "react";
import styles from "../page.module.css";

interface Track {
  position: string;
  type_?: string;
  title: string;
  duration?: string;
}

interface TrackListProps {
  tracks: Track[];
  title?: string;
  defaultOpen?: boolean;
}

export default function TrackList({ tracks, title = "Track List", defaultOpen = false }: TrackListProps) {
  const [showTracks, setShowTracks] = useState(defaultOpen);

  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <div className="window" style={{ marginBottom: "20px" }}>
      <div
        className="title-bar"
        style={{ cursor: "pointer" }}
        onClick={() => setShowTracks(!showTracks)}
      >
        {title} {showTracks ? "▲" : "▼"}
      </div>
      {showTracks && (
        <div className={styles.contentSection}>
          <div className={styles.trackList}>
            {tracks.map((track, index) => (
              <div key={index} className={styles.trackItem}>
                <span className={styles.trackPosition}>
                  {track.position}
                </span>
                <span className={styles.trackTitle}>
                  {track.title}
                </span>
                {track.duration && (
                  <span className={styles.trackDuration}>
                    {track.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}