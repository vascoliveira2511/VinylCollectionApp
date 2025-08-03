"use client";

import { useState } from "react";
import Button from "./Button";
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
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className={styles.cleanVideosList}>
      {videos.map((video, idx) => (
        <div key={idx} className={styles.cleanVideoItem}>
          <div className={styles.videoContent}>
            <h4 className={styles.videoTitle}>{video.title}</h4>
            {video.description && (
              <p className={styles.videoDescription}>
                {video.description}
              </p>
            )}
            {video.duration && (
              <span className={styles.videoDuration}>
                {Math.floor(video.duration / 60)}:
                {(video.duration % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
          <div className={styles.videoActions}>
            <Button
              href={video.uri}
              variant="outline"
              size="small"
            >
              Watch →
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
