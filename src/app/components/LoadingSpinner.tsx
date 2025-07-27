"use client";

import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
}

export default function LoadingSpinner({
  size = "medium",
  text = "Loading...",
}: LoadingSpinnerProps) {
  const getSizeClass = () => {
    switch (size) {
      case "small": return styles.small;
      case "large": return styles.large;
      default: return styles.medium;
    }
  };

  return (
    <div className={styles.loadingContainer}>
      <div className={`${styles.vinylLoader} ${getSizeClass()}`}>
        <div className={styles.vinylRecord}></div>
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
}
