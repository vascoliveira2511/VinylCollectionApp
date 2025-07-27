"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";

interface StatusButtonsProps {
  discogsId: number;
  onStatusChange?: (status: "want" | "have" | null) => void;
}

export default function StatusButtons({
  discogsId,
  onStatusChange,
}: StatusButtonsProps) {
  const [userStatus, setUserStatus] = useState<"want" | "have" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [discogsId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/vinyl-status?discogsId=${discogsId}`);
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: "want" | "have") => {
    try {
      // Toggle status - if already set to this status, remove it
      const newStatus = userStatus === status ? null : status;

      const response = await fetch("/api/vinyl-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discogsId: discogsId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setUserStatus(newStatus);
        onStatusChange?.(newStatus);

        if (newStatus === "want") {
          alert(`Added to your wantlist!`);
        } else if (newStatus === "have") {
          alert(`Marked as owned!`);
        } else {
          alert(`Removed from ${status === "want" ? "wantlist" : "owned"}`);
        }
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to update status"));
      }
    } catch (err) {
      alert(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => handleStatusChange("want")}
        className={`${styles.statusButton} ${
          userStatus === "want" ? styles.statusActive : ""
        }`}
      >
        {userStatus === "want" ? "❤️ In Wantlist" : "❤️ Want"}
      </button>

      <button
        onClick={() => handleStatusChange("have")}
        className={`${styles.statusButton} ${
          userStatus === "have" ? styles.statusActive : ""
        }`}
      >
        {userStatus === "have" ? "✅ Have" : "✅ Mark as Have"}
      </button>
    </>
  );
}
