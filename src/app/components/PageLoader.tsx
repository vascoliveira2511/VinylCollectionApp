"use client";

import styles from "./PageLoader.module.css";

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  return (
    <div className={styles.pageLoaderOverlay}>
      <div className={styles.loaderContent}>
        <div className="vinyl-loader" style={{width: '60px', height: '60px'}}>
          <div className="vinyl-record"></div>
        </div>
        <p className={styles.loadingText}>{text}</p>
      </div>
    </div>
  );
}