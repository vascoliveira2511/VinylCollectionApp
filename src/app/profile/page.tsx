"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import Avatar from "../components/Avatar";
import PageLoader from "../components/PageLoader";
import Button from "../components/Button";
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
  email?: string;
  totalRecords: number;
  genreStats: Record<string, number>;
  recentVinyls: Vinyl[];
  createdAt: string;
  lastLoginAt?: string;
  avatar?: string;
  avatarType?: string;
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

  // Discogs sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Note: Image upload is handled by the Avatar component directly

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

  // handleImageUpload removed - Avatar component handles this directly

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
    return <PageLoader text="Loading profile..." />;
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.contentSection}>
            <div className={styles.modernEmptyState}>
              <h3 className={styles.emptyStateTitle}>Unable to load profile</h3>
              <p className={styles.emptyStateDescription}>
                Please try refreshing the page or contact support if the problem
                persists.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          {/* Profile Hero Section */}
          <div className={styles.friendsHeroSection}>
            <div className={styles.friendsHeroContent}>
              <div className={styles.friendsHeroLeft}>
                <h1 className={styles.friendsPageTitle}>Account Settings</h1>
                <p className={styles.friendsPageDescription}>
                  Manage your profile, security, and integrations
                </p>
              </div>
            </div>
          </div>

          {/* Modern Tab Navigation */}
          <div className={styles.modernTabNav}>
            <button
              className={
                activeTab === "overview"
                  ? styles.modernTabActive
                  : styles.modernTabInactive
              }
              onClick={() => setActiveTab("overview")}
              aria-selected={activeTab === "overview"}
              role="tab"
            >
              Overview
            </button>
            <button
              className={
                activeTab === "security"
                  ? styles.modernTabActive
                  : styles.modernTabInactive
              }
              onClick={() => setActiveTab("security")}
              aria-selected={activeTab === "security"}
              role="tab"
            >
              Security
            </button>
            <button
              className={
                activeTab === "discogs"
                  ? styles.modernTabActive
                  : styles.modernTabInactive
              }
              onClick={() => setActiveTab("discogs")}
              aria-selected={activeTab === "discogs"}
              role="tab"
            >
              Discogs
            </button>
            <button
              className={
                activeTab === "danger"
                  ? styles.modernTabActive
                  : styles.modernTabInactive
              }
              onClick={() => setActiveTab("danger")}
              aria-selected={activeTab === "danger"}
              role="tab"
            >
              Danger Zone
            </button>
          </div>

          {error && <div className={styles.modernErrorMessage}>{error}</div>}

          <div className={styles.modernTabContent}>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className={styles.profileCardSpacing}>
                <div className={styles.sectionHeader}>
                  <h2>Account Overview</h2>
                  <p>Your profile information and collection insights</p>
                </div>

                {/* Profile & Account Information */}
                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <Avatar
                      username={user.username}
                      avatar={user.avatar}
                      avatarType={user.avatarType}
                      size="large"
                      editable={true}
                      onAvatarChange={handleAvatarChange}
                    />
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>{user.username}</h4>
                      {user.email && (
                        <p className={styles.friendMeta}>{user.email}</p>
                      )}
                      <p className={styles.friendMeta}>
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      {user.lastLoginAt && (
                        <p className={styles.friendMeta}>
                          Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className={styles.modernFriendActions}>
                      <Button onClick={logout} variant="outline" size="medium">
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Collection & Recent Activity */}
                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>Collection Overview</h4>
                      <p className={styles.friendMeta}>
                        {user.totalRecords} total records
                      </p>
                      {user.genreStats && Object.keys(user.genreStats).length > 0 && (
                        <>
                          <p className={styles.friendMeta}>
                            Top genre: {Object.entries(user.genreStats)
                              .sort(([,a], [,b]) => b - a)[0]?.[0]} 
                            ({Object.entries(user.genreStats)
                              .sort(([,a], [,b]) => b - a)[0]?.[1]} records)
                          </p>
                          <p className={styles.friendMeta}>
                            {Object.keys(user.genreStats).length} different genres
                          </p>
                        </>
                      )}
                      {user.discogsUsername && (
                        <p className={styles.friendMeta}>
                          Discogs connected as {user.discogsUsername}
                        </p>
                      )}
                      
                      {user.recentVinyls && user.recentVinyls.length > 0 && (
                        <div className={styles.profileSection}>
                          <h5 className={styles.sectionTitle}>Recent Additions</h5>
                          <div className={styles.recentRecordsList}>
                            {user.recentVinyls.slice(0, 3).map((vinyl, index) => (
                              <p key={vinyl.id} className={styles.recentRecord}>
                                {vinyl.artist} - {vinyl.title} {vinyl.year && `(${vinyl.year})`}
                              </p>
                            ))}
                            {user.recentVinyls.length > 3 && (
                              <p className={styles.moreRecords}>
                                ... and {user.recentVinyls.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.modernFriendActions}>
                      <Button href="/collections" variant="primary" size="medium">
                        View Collections
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>Quick Actions</h4>
                      <p className={styles.friendMeta}>
                        Commonly used features and shortcuts
                      </p>
                    </div>
                    <div className={styles.modernFriendActions}>
                      <Button href="/browse" variant="outline" size="medium">
                        Browse Records
                      </Button>
                      <Button href="/friends" variant="outline" size="medium">
                        Manage Friends
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("discogs")} 
                        variant="outline" 
                        size="medium"
                      >
                        Sync Collection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className={styles.profileCardSpacing}>
                <div className={styles.sectionHeader}>
                  <h2>Security Settings</h2>
                  <p>Change your password and manage account security</p>
                </div>

                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>Change Password</h4>

                      <form
                        id="password-form"
                        onSubmit={handlePasswordChange}
                        className={styles.profileForm}
                      >
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className={styles.profileFormInput}
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          className={styles.profileFormInput}
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className={styles.profileFormInput}
                        />

                        {passwordChangeSuccess && (
                          <div className={styles.profileSuccessMessage}>
                            Password changed successfully!
                          </div>
                        )}
                        <div className={styles.modernFriendActions}>
                          <Button
                            type="submit"
                            disabled={passwordChangeLoading}
                            variant="primary"
                            size="medium"
                          >
                            {passwordChangeLoading
                              ? "Changing..."
                              : "Change Password"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Discogs Integration Tab */}
            {activeTab === "discogs" && (
              <div className={styles.profileCardSpacing}>
                <div className={styles.sectionHeader}>
                  <h2>Discogs Integration</h2>
                  <p>Connect your Discogs account to sync your collection</p>
                </div>

                {syncSuccess && (
                  <div className={styles.successMessage}>
                    {user?.discogsUsername
                      ? "Discogs account connected successfully!"
                      : "Collection synced successfully!"}
                  </div>
                )}

                {syncError && (
                  <div className={styles.modernErrorMessage}>{syncError}</div>
                )}

                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>Connection Status</h4>
                      {user?.discogsUsername ? (
                        <>
                          <p className={styles.friendMeta}>
                            Connected as <strong>{user.discogsUsername}</strong>
                          </p>
                          <p className={styles.friendMeta}>
                            Your Discogs account is connected and ready to sync.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className={styles.friendMeta}>Not Connected</p>
                          <p className={styles.friendMeta}>
                            Connect your Discogs account to sync your collection.
                          </p>
                        </>
                      )}
                      
                      {user?.discogsUsername && (
                        <div className={styles.profileSection}>
                          <h5 className={styles.sectionTitle}>Collection Sync</h5>
                          <p className={styles.friendMeta}>
                            Current Records: {user.totalRecords}
                          </p>
                          <p className={styles.friendMeta}>
                            Sync your Discogs collection to import records automatically.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={styles.modernFriendActions}>
                      {user?.discogsUsername ? (
                        <>
                          <Button
                            onClick={syncDiscogsCollection}
                            disabled={syncLoading || cleanupLoading}
                            variant="primary"
                            size="medium"
                          >
                            {syncLoading ? "Syncing..." : "Sync Collection"}
                          </Button>
                          <Button
                            onClick={cleanupDuplicates}
                            disabled={syncLoading || cleanupLoading}
                            variant="outline"
                            size="medium"
                          >
                            {cleanupLoading ? "Cleaning..." : "Remove Duplicates"}
                          </Button>
                          <Button
                            onClick={disconnectDiscogs}
                            disabled={disconnectLoading}
                            variant="outline"
                            size="medium"
                          >
                            {disconnectLoading ? "Disconnecting..." : "Disconnect"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={connectDiscogs}
                          variant="primary"
                          size="medium"
                        >
                          Connect Discogs
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className={styles.profileCardSpacing}>
                <div className={styles.sectionHeader}>
                  <h2>Danger Zone</h2>
                  <p>Irreversible and destructive actions</p>
                </div>

                <div className={styles.modernFriendsList}>
                  <div className={styles.modernFriendCard}>
                    <div className={styles.modernFriendInfo}>
                      <h4 className={styles.friendName}>Delete Account</h4>
                      <p
                        className={styles.friendMeta}
                        style={{ color: "var(--text-danger)" }}
                      >
                        Warning: This action cannot be undone. This will
                        permanently delete your account and all your vinyl
                        records.
                      </p>

                      <form
                        id="delete-form"
                        onSubmit={handleDeleteAccount}
                        className={styles.profileForm}
                      >
                        <input
                          type="password"
                          placeholder="Enter your password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          required
                          className={styles.profileFormInput}
                        />
                        <input
                          type="text"
                          placeholder='Type "DELETE" to confirm'
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          required
                          className={styles.profileFormInput}
                        />
                        <div className={styles.modernFriendActions}>
                          <Button
                            type="submit"
                            disabled={
                              deleteLoading || deleteConfirm !== "DELETE"
                            }
                            variant="danger"
                            size="medium"
                          >
                            {deleteLoading ? "Deleting..." : "Delete Account"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
