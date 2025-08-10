"use client";

import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { apiClient } from "@/lib/api-client";
import PageLoader from "../components/PageLoader";
import styles from "./stats.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface StatsData {
  totalRecords: number;
  totalValue: number;
  averageRating: number;
  genreStats: Record<string, number>;
  decadeStats: Record<string, number>;
  artistStats: Record<string, number>;
  conditionStats: Record<string, number>;
  collectionGrowth: Array<{ date: string; count: number }>;
  topValuedRecords: Array<{
    id: number;
    artist: string;
    title: string;
    purchasePrice: number;
    purchaseCurrency: string;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API call for comprehensive stats
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        // Fallback: generate stats from existing data
        try {
          const vinyls = await apiClient.getVinylCollection({});
          const fallbackStats = generateStatsFromVinyls(vinyls);
          setStats(fallbackStats);
        } catch (fallbackErr) {
          setError("Failed to load statistics");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const generateStatsFromVinyls = (vinyls: any[]): StatsData => {
    const genreStats: Record<string, number> = {};
    const decadeStats: Record<string, number> = {};
    const artistStats: Record<string, number> = {};
    const conditionStats: Record<string, number> = {};
    const collectionGrowth: Array<{ date: string; count: number }> = [];

    let totalValue = 0;
    let totalRating = 0;
    let ratedRecords = 0;

    vinyls.forEach((vinyl) => {
      // Genre stats
      if (vinyl.genre && Array.isArray(vinyl.genre)) {
        vinyl.genre.forEach((genre: string) => {
          genreStats[genre] = (genreStats[genre] || 0) + 1;
        });
      }

      // Decade stats
      if (vinyl.year) {
        const decade = `${Math.floor(vinyl.year / 10) * 10}s`;
        decadeStats[decade] = (decadeStats[decade] || 0) + 1;
      }

      // Artist stats
      if (vinyl.artist) {
        artistStats[vinyl.artist] = (artistStats[vinyl.artist] || 0) + 1;
      }

      // Condition stats
      if (vinyl.condition) {
        conditionStats[vinyl.condition] = (conditionStats[vinyl.condition] || 0) + 1;
      }

      // Value calculation
      if (vinyl.purchasePrice) {
        totalValue += vinyl.purchasePrice;
      }

      // Rating calculation
      if (vinyl.rating) {
        totalRating += vinyl.rating;
        ratedRecords++;
      }
    });

    // Generate collection growth (simplified)
    const sortedVinyls = vinyls
      .filter((v) => v.createdAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let currentCount = 0;
    const monthlyGrowth = new Map<string, number>();
    
    sortedVinyls.forEach((vinyl) => {
      currentCount++;
      const date = new Date(vinyl.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowth.set(monthKey, currentCount);
    });

    monthlyGrowth.forEach((count, date) => {
      collectionGrowth.push({ date, count });
    });

    return {
      totalRecords: vinyls.length,
      totalValue,
      averageRating: ratedRecords > 0 ? totalRating / ratedRecords : 0,
      genreStats,
      decadeStats,
      artistStats,
      conditionStats,
      collectionGrowth,
      topValuedRecords: vinyls
        .filter((v) => v.purchasePrice)
        .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
        .slice(0, 5)
        .map((v) => ({
          id: v.id,
          artist: v.artist,
          title: v.title,
          purchasePrice: v.purchasePrice,
          purchaseCurrency: v.purchaseCurrency || "USD",
        })),
    };
  };

  if (loading) {
    return <PageLoader text="Calculating Your Collection Statistics..." />;
  }

  if (error || !stats) {
    return (
      <div className={styles.error}>
        <h2>Unable to Load Statistics</h2>
        <p>{error || "Something went wrong"}</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "var(--ctp-text)",
        },
      },
      tooltip: {
        backgroundColor: "var(--ctp-surface0)",
        titleColor: "var(--ctp-text)",
        bodyColor: "var(--ctp-text)",
        borderColor: "var(--ctp-surface1)",
      },
    },
    scales: {
      x: {
        ticks: { color: "var(--ctp-text)" },
        grid: { color: "var(--ctp-surface1)" },
      },
      y: {
        ticks: { color: "var(--ctp-text)" },
        grid: { color: "var(--ctp-surface1)" },
      },
    },
  };

  const genreChartData = {
    labels: Object.keys(stats.genreStats).slice(0, 10),
    datasets: [
      {
        label: "Records",
        data: Object.values(stats.genreStats).slice(0, 10),
        backgroundColor: [
          "var(--ctp-red)",
          "var(--ctp-green)",
          "var(--ctp-blue)",
          "var(--ctp-yellow)",
          "var(--ctp-pink)",
          "var(--ctp-teal)",
          "var(--ctp-lavender)",
          "var(--ctp-peach)",
          "var(--ctp-sky)",
          "var(--ctp-mauve)",
        ],
      },
    ],
  };

  const decadeChartData = {
    labels: Object.keys(stats.decadeStats).sort(),
    datasets: [
      {
        label: "Records",
        data: Object.keys(stats.decadeStats)
          .sort()
          .map((decade) => stats.decadeStats[decade]),
        backgroundColor: "var(--ctp-blue)",
        borderColor: "var(--ctp-blue)",
        borderWidth: 1,
      },
    ],
  };

  const growthChartData = {
    labels: stats.collectionGrowth.map((item) => item.date),
    datasets: [
      {
        label: "Collection Size",
        data: stats.collectionGrowth.map((item) => item.count),
        borderColor: "var(--ctp-green)",
        backgroundColor: "var(--ctp-green)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className={styles.statsPage}>
      <div className="content-wrapper">
        <header className={styles.header}>
          <h1>Collection Statistics</h1>
          <p>Deep insights into your vinyl collection</p>
        </header>

        {/* Quick Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.totalRecords}</div>
            <div className={styles.statLabel}>Total Records</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {stats.totalValue > 0 ? `$${stats.totalValue.toFixed(2)}` : "N/A"}
            </div>
            <div className={styles.statLabel}>Collection Value</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
            <div className={styles.statLabel}>Average Rating</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {Object.keys(stats.genreStats).length}
            </div>
            <div className={styles.statLabel}>Unique Genres</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Genre Distribution */}
          <div className={styles.chartCard}>
            <h3>Genre Distribution</h3>
            <div className={styles.chartContainer}>
              <Pie data={genreChartData} options={{
                ...chartOptions,
                scales: undefined,
              }} />
            </div>
          </div>

          {/* Decade Breakdown */}
          <div className={styles.chartCard}>
            <h3>Records by Decade</h3>
            <div className={styles.chartContainer}>
              <Bar data={decadeChartData} options={chartOptions} />
            </div>
          </div>

          {/* Collection Growth */}
          <div className={styles.chartCard + " " + styles.fullWidth}>
            <h3>Collection Growth Over Time</h3>
            <div className={styles.chartContainer}>
              <Line data={growthChartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Artists */}
          <div className={styles.chartCard}>
            <h3>Top Artists</h3>
            <div className={styles.listContainer}>
              {Object.entries(stats.artistStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([artist, count], index) => (
                  <div key={artist} className={styles.listItem}>
                    <span className={styles.rank}>{index + 1}</span>
                    <span className={styles.name}>{artist}</span>
                    <span className={styles.count}>{count} records</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Most Valuable Records */}
          {stats.topValuedRecords.length > 0 && (
            <div className={styles.chartCard}>
              <h3>Most Valuable Records</h3>
              <div className={styles.listContainer}>
                {stats.topValuedRecords.map((record, index) => (
                  <div key={record.id} className={styles.listItem}>
                    <span className={styles.rank}>{index + 1}</span>
                    <div className={styles.recordInfo}>
                      <span className={styles.name}>
                        {record.artist} - {record.title}
                      </span>
                      <span className={styles.price}>
                        {record.purchaseCurrency} {record.purchasePrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}