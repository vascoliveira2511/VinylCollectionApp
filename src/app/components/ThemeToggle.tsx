"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.themeToggle}>
        <button className={styles.toggleButton} disabled>
          <FiMonitor size={18} />
        </button>
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <FiMonitor size={18} />;
    } else if (resolvedTheme === "dark") {
      return <FiMoon size={18} />;
    } else {
      return <FiSun size={18} />;
    }
  };

  const getLabel = () => {
    if (theme === "system") {
      return "System";
    } else if (resolvedTheme === "dark") {
      return "Dark";
    } else {
      return "Light";
    }
  };

  return (
    <div className={styles.themeToggle}>
      <button
        onClick={cycleTheme}
        className={styles.toggleButton}
        aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} theme`}
        title={`Current: ${getLabel()}. Click to cycle themes.`}
      >
        {getIcon()}
        <span className={styles.themeLabel}>{getLabel()}</span>
      </button>
    </div>
  );
}