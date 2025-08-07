"use client";

import styles from "./InlineLoader.module.css";

interface InlineLoaderProps {
  text?: string;
}

export default function InlineLoader({
  text = "Loading...",
}: InlineLoaderProps) {
  return (
    <div className={styles.inlineLoader}>
      <div className="vinyl-loader" style={{ width: "40px", height: "40px" }}>
        <div className="vinyl-record"></div>
      </div>
      <p className={styles.loadingText}>{text}</p>
    </div>
  );
}
