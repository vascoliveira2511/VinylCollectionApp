"use client";

import styles from "./PageLoader.module.css";

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  return (
    <div className={styles.pageLoaderOverlay}>
      <div className={styles.loaderContent}>
        <div className={styles.vinylLoader}>
          <div className={styles.vinylIcon}></div>
        </div>
        <p className={styles.loadingText}>{text}</p>
      </div>
    </div>
  );
}