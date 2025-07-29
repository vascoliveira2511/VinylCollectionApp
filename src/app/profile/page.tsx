"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import Avatar from "../components/Avatar";
import styles from "../page.module.css";

interface Vinyl {
  id: number;
  artist: string;
  title: string;
  year?: number;
  genre: string[];
  imageUrl?: string;
  discogsId?: number;
}

interface User {
  id: number;
  username: string;
  totalRecords: number;
  genreStats: Record<string, number>;
  recentVinyls: Vinyl[];
  createdAt: string;
  avatar?: string;
  avatarType?: string;
  // Preferences
  displayView?: string;
  recordsPerPage?: number;
  showGenreChart?: boolean;
  showDecadeChart?: boolean;
  discogsEnabled?: boolean;
  // Discogs integration
  discogsUsername?: string;
  discogsAccessToken?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Delete account form
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Preferences state
  const [displayView, setDisplayView] = useState("grid");
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [showGenreChart, setShowGenreChart] = useState(true);
  const [showDecadeChart, setShowDecadeChart] = useState(true);
  const [discogsEnabled, setDiscogsEnabled] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState(false);

  // Discogs sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const router = useRouter();

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user data");
      }
      const userData = await res.json();
      setUser(userData);

      // Set preferences from user data
      setDisplayView(userData.displayView || "grid");
      setRecordsPerPage(userData.recordsPerPage || 20);
      setShowGenreChart(
        userData.showGenreChart !== undefined ? userData.showGenreChart : true
      );
      setShowDecadeChart(
        userData.showDecadeChart !== undefined ? userData.showDecadeChart : true
      );
      setDiscogsEnabled(
        userData.discogsEnabled !== undefined ? userData.discogsEnabled : true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleAvatarChange = async (avatar: string, avatarType: string) => {
    try {
      setError(null);
      const res = await fetch("/api/auth/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, avatarType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update avatar");
      }

      // Update local user state
      if (user) {
        setUser({
          ...user,
          avatar,
          avatarType,
        });
      }

      // Force a page refresh to update navbar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setPasswordChangeLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordChangeSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const savePreferences = async () => {
    setPreferencesLoading(true);
    setError(null);
    setPreferencesSuccess(false);

    try {
      const preferences = {
        displayView,
        recordsPerPage,
        showGenreChart,
        showDecadeChart,
        discogsEnabled,
      };

      const res = await fetch("/api/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      setPreferencesSuccess(true);

      // Update local user state with saved preferences
      if (user) {
        setUser({
          ...user,
          displayView,
          recordsPerPage,
          showGenreChart,
          showDecadeChart,
          discogsEnabled,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirm !== "DELETE") {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmDelete: deleteConfirm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  const connectDiscogs = () => {
    window.location.href = "/api/auth/discogs";
  };

  const disconnectDiscogs = async () => {
    setDisconnectLoading(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/auth/discogs/disconnect", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect Discogs");
      }

      // Update user state
      if (user) {
        setUser({
          ...user,
          discogsUsername: undefined,
          discogsAccessToken: undefined,
        });
      }

      setSyncSuccess(false);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDisconnectLoading(false);
    }
  };

  const syncDiscogsCollection = async () => {
    setSyncLoading(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const res = await fetch("/api/discogs/sync-collection", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync collection");
      }

      const result = await res.json();
      setSyncSuccess(true);

      // Refresh user data to get updated collection count
      await fetchUserData();

      // Show success message with details
      if (result.syncedCount > 0) {
        setSyncError(null);
      } else {
        setSyncError(
          "No new records were synced. Your collection may already be up to date."
        );
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSyncLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    setCleanupLoading(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const res = await fetch("/api/discogs/cleanup-duplicates", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cleanup duplicates");
      }

      const result = await res.json();
      setSyncSuccess(true);

      // Refresh user data to get updated collection count
      await fetchUserData();

      // Show success message with details
      if (result.mergedCount > 0) {
        setSyncError(
          `Successfully merged ${result.mergedCount} duplicate records and removed ${result.removedCount} duplicates.`
        );
      } else {
        setSyncError("No duplicates found to merge.");
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCleanupLoading(false);
    }
  };

  // Check for OAuth callback messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("discogs") === "connected") {
      setSyncSuccess(true);
      // Clean up URL
      window.history.replaceState({}, "", "/profile");
      // Refresh user data
      fetchUserData();
    } else if (urlParams.get("error")) {
      setSyncError(urlParams.get("error") || "OAuth failed");
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className={styles.contentSection}>
              <p>Unable to load profile</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className="window">
          <div className="title-bar">Account Settings</div>
          <div className={styles.contentSection}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <button
                className={
                  activeTab === "overview"
                    ? styles.tabActive
                    : styles.tabInactive
                }
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={
                  activeTab === "preferences"
                    ? styles.tabActive
                    : styles.tabInactive
                }
                onClick={() => setActiveTab("preferences")}
              >
                Preferences
              </button>
              <button
                className={
                  activeTab === "security"
                    ? styles.tabActive
                    : styles.tabInactive
                }
                onClick={() => setActiveTab("security")}
              >
                Security
              </button>
              <button
                className={
                  activeTab === "discogs"
                    ? styles.tabActive
                    : styles.tabInactive
                }
                onClick={() => setActiveTab("discogs")}
              >
                Discogs
              </button>
              <button
                className={
                  activeTab === "data" ? styles.tabActive : styles.tabInactive
                }
                onClick={() => setActiveTab("data")}
              >
                Data & Privacy
              </button>
              <button
                className={
                  activeTab === "danger" ? styles.tabActive : styles.tabInactive
                }
                onClick={() => setActiveTab("danger")}
              >
                Danger Zone
              </button>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className={styles.tabContent}>
                <h2>Account Overview</h2>
                <div className={styles.profileGrid}>
                  <div className={styles.profileCard}>
                    <h3>Profile Information</h3>
                    <div className={styles.profileInfo}>
                      <div className={styles.avatarSection}>
                        <Avatar
                          username={user.username}
                          avatar={user.avatar}
                          avatarType={user.avatarType}
                          size="large"
                          editable={true}
                          onAvatarChange={handleAvatarChange}
                        />
                      </div>
                      <p>
                        <strong>Username:</strong> {user.username}
                      </p>
                      <p>
                        <strong>Member since:</strong>{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Total Records:</strong> {user.totalRecords}
                      </p>
                    </div>
                  </div>

                  <div className={styles.profileCard}>
                    <h3>Collection Stats</h3>
                    <div className={styles.genreStats}>
                      {Object.entries(user.genreStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([genre, count]) => (
                          <div key={genre} className={styles.genreStat}>
                            <span className={styles.genreName}>{genre}</span>
                            <span className={styles.genreCount}>{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className={styles.profileCard}>
                    <h3>Recent Additions</h3>
                    <div className={styles.recentVinyls}>
                      {user.recentVinyls.slice(0, 5).map((vinyl) => (
                        <Link
                          key={vinyl.id}
                          href={`/vinyl/${vinyl.id}`}
                          className={styles.recentVinyl}
                        >
                          <span className={styles.vinylTitle}>
                            {vinyl.title}
                          </span>
                          <span className={styles.vinylArtist}>
                            {vinyl.artist}
                          </span>
                        </Link>
                      ))}
                      {user.recentVinyls.length === 0 && (
                        <p className={styles.emptyState}>
                          No records added yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <button onClick={logout} className={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className={styles.tabContent}>
                <h2>Display Preferences</h2>

                {preferencesSuccess && (
                  <div className={styles.successMessage}>
                    Preferences saved successfully!
                  </div>
                )}

                <div className={styles.preferencesGrid}>
                  <div className={styles.preferenceCard}>
                    <h3>Collection Display</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.preferenceLabel}>
                        <span>Default Collection View</span>
                      </label>
                      <div className={styles.viewSelector}>
                        <div
                          className={`${styles.viewOption} ${
                            displayView === "grid" ? styles.selected : ""
                          }`}
                          onClick={() => setDisplayView("grid")}
                        >
                          <span className={styles.viewIcon}>⊞</span>
                          <div className={styles.viewTitle}>Grid</div>
                          <div className={styles.viewDescription}>
                            Cards in a grid layout
                          </div>
                        </div>
                        <div
                          className={`${styles.viewOption} ${
                            displayView === "list" ? styles.selected : ""
                          }`}
                          onClick={() => setDisplayView("list")}
                        >
                          <span className={styles.viewIcon}>☰</span>
                          <div className={styles.viewTitle}>List</div>
                          <div className={styles.viewDescription}>
                            Horizontal list layout
                          </div>
                        </div>
                        <div
                          className={`${styles.viewOption} ${
                            displayView === "compact" ? styles.selected : ""
                          }`}
                          onClick={() => setDisplayView("compact")}
                        >
                          <span className={styles.viewIcon}>▦</span>
                          <div className={styles.viewTitle}>Compact</div>
                          <div className={styles.viewDescription}>
                            Smaller grid, no genres
                          </div>
                        </div>
                      </div>

                      <label className={styles.preferenceLabel}>
                        <span>Records per Page</span>
                      </label>
                      <div className={styles.recordsPerPageSelector}>
                        {[12, 20, 24, 48, 96].map((count) => (
                          <div
                            key={count}
                            className={`${styles.recordsOption} ${
                              recordsPerPage === count ? styles.selected : ""
                            }`}
                            onClick={() => setRecordsPerPage(count)}
                          >
                            {count}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.preferenceCard}>
                    <h3>Statistics</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showGenreChart}
                          onChange={(e) => setShowGenreChart(e.target.checked)}
                        />
                        <span>Show genre charts by default</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showDecadeChart}
                          onChange={(e) => setShowDecadeChart(e.target.checked)}
                        />
                        <span>Show year distribution</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" disabled />
                        <span>Show country breakdown (Coming Soon)</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.preferenceCard}>
                    <h3>Discogs Integration</h3>
                    <div className={styles.preferenceSection}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={discogsEnabled}
                          onChange={(e) => setDiscogsEnabled(e.target.checked)}
                        />
                        <span>Enable Discogs integration</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked disabled />
                        <span>
                          Include high-resolution images (Coming Soon)
                        </span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" disabled />
                        <span>Show marketplace prices (Coming Soon)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={savePreferences}
                    disabled={preferencesLoading}
                    className={styles.primaryButton}
                  >
                    {preferencesLoading ? (
                      <>
                        <div className="vinyl-loader" style={{width: '16px', height: '16px', marginRight: '8px'}}>
                          <div className="vinyl-record"></div>
                        </div>
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className={styles.tabContent}>
                <h2>Security Settings</h2>

                <div className={styles.securityCard}>
                  <h3>Change Password</h3>
                  <form
                    onSubmit={handlePasswordChange}
                    className={styles.passwordForm}
                  >
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />

                    {passwordChangeSuccess && (
                      <div className={styles.successMessage}>
                        Password changed successfully!
                      </div>
                    )}

                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        disabled={passwordChangeLoading}
                        className={styles.primaryButton}
                      >
                        {passwordChangeLoading
                          ? "Changing..."
                          : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Discogs Integration Tab */}
            {activeTab === "discogs" && (
              <div className={styles.tabContent}>
                <h2>Discogs Integration</h2>

                {syncSuccess && (
                  <div className={styles.successMessage}>
                    {user?.discogsUsername
                      ? "Discogs account connected successfully!"
                      : "Collection synced successfully!"}
                  </div>
                )}

                {syncError && (
                  <div className={styles.errorMessage}>{syncError}</div>
                )}

                <div className={styles.discogsGrid}>
                  <div className={styles.discogsCard}>
                    <h3>Connection Status</h3>
                    {user?.discogsUsername ? (
                      <div className={styles.connectedStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={styles.statusDot}></span>
                          <span>
                            Connected as <strong>{user.discogsUsername}</strong>
                          </span>
                        </div>
                        <p className={styles.statusDescription}>
                          Your Discogs account is connected and ready to sync.
                        </p>
                        <button
                          onClick={disconnectDiscogs}
                          disabled={disconnectLoading}
                          className={styles.disconnectButton}
                        >
                          {disconnectLoading
                            ? "Disconnecting..."
                            : "Disconnect Account"}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.disconnectedStatus}>
                        <div className={styles.statusIndicator}>
                          <span className={styles.statusDotDisconnected}></span>
                          <span>Not Connected</span>
                        </div>
                        <p className={styles.statusDescription}>
                          Connect your Discogs account to sync your collection
                          and access advanced features.
                        </p>
                        <button
                          onClick={connectDiscogs}
                          className={styles.connectButton}
                        >
                          Connect Discogs Account
                        </button>
                      </div>
                    )}
                  </div>

                  {user?.discogsUsername && (
                    <div className={styles.discogsCard}>
                      <h3>Collection Sync</h3>
                      <p className={styles.syncDescription}>
                        Sync your Discogs collection to import all your records
                        automatically. This will add new records from your
                        Discogs collection to your default collection.
                      </p>
                      <div className={styles.syncInfo}>
                        <div className={styles.syncStat}>
                          <span className={styles.syncLabel}>
                            Current Records:
                          </span>
                          <span className={styles.syncValue}>
                            {user.totalRecords}
                          </span>
                        </div>
                      </div>
                      <div className={styles.syncActions}>
                        <button
                          onClick={syncDiscogsCollection}
                          disabled={syncLoading || cleanupLoading}
                          className={styles.syncButton}
                        >
                          {syncLoading
                            ? "Syncing Collection..."
                            : "Sync Collection"}
                        </button>
                        <button
                          onClick={cleanupDuplicates}
                          disabled={syncLoading || cleanupLoading}
                          className={styles.cleanupButton}
                        >
                          {cleanupLoading
                            ? "Cleaning up..."
                            : "Remove Duplicates"}
                        </button>
                      </div>
                      <p className={styles.syncNote}>
                        <small>
                          Note: Large collections may take several minutes to sync
                          due to API rate limits. Use "Remove Duplicates" to
                          merge existing records with Discogs data.
                        </small>
                      </p>
                    </div>
                  )}

                  <div className={styles.discogsCard}>
                    <h3>Features</h3>
                    <div className={styles.featureList}>
                      <div className={styles.feature}>
                        <span className={styles.featureIcon}>□</span>
                        <div className={styles.featureContent}>
                          <div className={styles.featureTitle}>
                            Collection Sync
                          </div>
                          <div className={styles.featureDescription}>
                            Import your entire Discogs collection
                          </div>
                        </div>
                      </div>
                      <div className={styles.feature}>
                        <span className={styles.featureIcon}>□</span>
                        <div className={styles.featureContent}>
                          <div className={styles.featureTitle}>
                            High-Quality Images
                          </div>
                          <div className={styles.featureDescription}>
                            Official release artwork and photos
                          </div>
                        </div>
                      </div>
                      <div className={styles.feature}>
                        <span className={styles.featureIcon}>□</span>
                        <div className={styles.featureContent}>
                          <div className={styles.featureTitle}>
                            Rich Metadata
                          </div>
                          <div className={styles.featureDescription}>
                            Complete release information and catalog numbers
                          </div>
                        </div>
                      </div>
                      <div className={styles.feature}>
                        <span className={styles.featureIcon}>★</span>
                        <div className={styles.featureContent}>
                          <div className={styles.featureTitle}>
                            Ratings & Notes
                          </div>
                          <div className={styles.featureDescription}>
                            Sync your personal ratings and collection notes
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.discogsCard}>
                    <h3>Privacy & Data</h3>
                    <div className={styles.privacyInfo}>
                      <p className={styles.privacyDescription}>
                        We only access your Discogs collection data. We never
                        modify your Discogs collection or access your personal
                        information beyond what's necessary for syncing.
                      </p>
                      <div className={styles.privacyDetails}>
                        <div className={styles.privacyItem}>
                          <span className={styles.privacyLabel}>
                            Data Access:
                          </span>
                          <span className={styles.privacyValue}>
                            Read-only collection data
                          </span>
                        </div>
                        <div className={styles.privacyItem}>
                          <span className={styles.privacyLabel}>
                            Rate Limit:
                          </span>
                          <span className={styles.privacyValue}>
                            240 requests per minute
                          </span>
                        </div>
                        <div className={styles.privacyItem}>
                          <span className={styles.privacyLabel}>
                            Token Storage:
                          </span>
                          <span className={styles.privacyValue}>
                            Encrypted in our database
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === "data" && (
              <div className={styles.tabContent}>
                <h2>Data & Privacy</h2>

                <div className={styles.dataGrid}>
                  <div className={styles.dataCard}>
                    <h3>Data Export</h3>
                    <p className={styles.dataDescription}>
                      Download your complete vinyl collection data in various
                      formats.
                    </p>
                    <div className={styles.exportButtons}>
                      <button className={styles.exportButton}>
                        Export as JSON
                      </button>
                      <button className={styles.exportButton}>
                        Export as CSV
                      </button>
                      <button className={styles.exportButton}>
                        Export as PDF Report
                      </button>
                    </div>
                  </div>

                  <div className={styles.dataCard}>
                    <h3>Data Import</h3>
                    <p className={styles.dataDescription}>
                      Import vinyl collection data from other sources.
                    </p>
                    <div className={styles.importSection}>
                      <input
                        type="file"
                        accept=".json,.csv"
                        className={styles.fileInput}
                        id="importFile"
                      />
                      <label htmlFor="importFile" className={styles.fileLabel}>
                        Choose File
                      </label>
                      <button className={styles.importButton} disabled>
                        Import Data
                      </button>
                    </div>
                  </div>

                  <div className={styles.dataCard}>
                    <h3>Privacy Settings</h3>
                    <div className={styles.privacySection}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" />
                        <span>Make collection publicly viewable</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked />
                        <span>Allow anonymous usage analytics</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked />
                        <span>Receive feature updates via email</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.dataCard}>
                    <h3>Storage Information</h3>
                    <div className={styles.storageInfo}>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>
                          Total Records:
                        </span>
                        <span className={styles.storageValue}>
                          {user.totalRecords}
                        </span>
                      </div>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>
                          Account Created:
                        </span>
                        <span className={styles.storageValue}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.storageItem}>
                        <span className={styles.storageLabel}>Data Size:</span>
                        <span className={styles.storageValue}>
                          ~{Math.ceil(user.totalRecords * 0.5)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className={styles.tabContent}>
                <h2>Danger Zone</h2>

                <div className={styles.dangerCard}>
                  <h3>Delete Account</h3>
                  <p className={styles.dangerWarning}>
                    Warning: This action cannot be undone. This will permanently
                    delete your account and all your vinyl records.
                  </p>

                  <form
                    onSubmit={handleDeleteAccount}
                    className={styles.deleteForm}
                  >
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder='Type "DELETE" to confirm'
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      required
                    />

                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        disabled={deleteLoading || deleteConfirm !== "DELETE"}
                        className={styles.deleteButton}
                      >
                        {deleteLoading ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
