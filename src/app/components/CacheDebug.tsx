"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface CacheStats {
  user: {
    size: number;
    pendingRequests: number;
    maxSize: number;
    defaultTTL: number;
  };
  collection: {
    size: number;
    pendingRequests: number;
    maxSize: number;
    defaultTTL: number;
  };
  discogs: {
    size: number;
    pendingRequests: number;
    maxSize: number;
    defaultTTL: number;
  };
  vinyl: {
    size: number;
    pendingRequests: number;
    maxSize: number;
    defaultTTL: number;
  };
}

export default function CacheDebug() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(apiClient.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "8px 12px",
          background: "var(--ctp-surface0)",
          border: "1px solid var(--ctp-overlay0)",
          borderRadius: "4px",
          color: "var(--ctp-text)",
          fontSize: "12px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        📊 Cache Stats
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "var(--ctp-surface0)",
        border: "1px solid var(--ctp-overlay0)",
        borderRadius: "8px",
        padding: "16px",
        fontSize: "12px",
        color: "var(--ctp-text)",
        maxWidth: "300px",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4 style={{ margin: 0 }}>Cache Performance</h4>
        <div>
          <button
            onClick={() => apiClient.clearAllCaches()}
            style={{
              padding: "4px 8px",
              marginRight: "8px",
              background: "var(--ctp-red)",
              border: "none",
              borderRadius: "4px",
              color: "white",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: "4px 8px",
              background: "var(--ctp-overlay0)",
              border: "none",
              borderRadius: "4px",
              color: "var(--ctp-text)",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gap: "8px" }}>
          {Object.entries(stats).map(([cacheName, cacheStats]) => (
            <div
              key={cacheName}
              style={{
                padding: "8px",
                background: "var(--ctp-surface1)",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "4px",
                  textTransform: "capitalize",
                }}
              >
                {cacheName} Cache
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  fontSize: "11px",
                }}
              >
                <div>
                  Size: {cacheStats.size}/{cacheStats.maxSize}
                </div>
                <div>Pending: {cacheStats.pendingRequests}</div>
                <div>TTL: {Math.round(cacheStats.defaultTTL / 1000 / 60)}m</div>
                <div>Hit Rate: {cacheStats.size > 0 ? "Active" : "Empty"}</div>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              background: "var(--ctp-surface1)",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--ctp-subtext1)" }}>
              Total Cached Items:{" "}
              {Object.values(stats).reduce((sum, cache) => sum + cache.size, 0)}
              <br />
              Memory Savings: ~
              {Object.values(stats).reduce(
                (sum, cache) => sum + cache.size,
                0
              ) * 50}{" "}
              API calls avoided
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
