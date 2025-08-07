"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "../../components/Avatar";
import PageLoader from "../../components/PageLoader";
import Button from "../../components/Button";
import styles from "../../page.module.css";

interface User {
  id: number;
  username: string;
  avatar?: string;
  avatarType?: string;
}

interface Collection {
  id: number;
  title: string;
  description?: string;
  isPublic: boolean;
  _count: {
    vinyls: number;
  };
  vinyls: {
    id: number;
    imageUrl?: string;
    artist: string;
    title: string;
  }[];
}

interface UserData {
  user: User;
  collections: Collection[];
}

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, [params.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${params.id}/collections`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          setError("You are not friends with this user");
          return;
        }
        if (res.status === 404) {
          setError("User not found");
          return;
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading user profile..." />;
  }

  if (error || !userData) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.contentSection}>
            <div className={styles.modernEmptyState}>
              <div className={styles.emptyStateIcon}>❌</div>
              <h3 className={styles.emptyStateTitle}>
                {error || "User not found"}
              </h3>
              <p className={styles.emptyStateDescription}>
                {error === "You are not friends with this user"
                  ? "You need to be friends with this user to view their profile."
                  : error === "User not found"
                  ? "The user you're looking for doesn't exist."
                  : "Something went wrong while loading the user profile."}
              </p>
              <div className={styles.heroActions}>
                <Button href="/friends" variant="primary" size="medium">
                  ← Back to Friends
                </Button>
              </div>
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
          {/* Back Button */}
          <div className={styles.heroActions} style={{ marginBottom: "48px" }}>
            <Button href="/friends" variant="outline" size="medium">
              ← Back to Friends
            </Button>
          </div>

          {/* User Profile Hero Section */}
          <div className={styles.friendsHeroSection}>
            <div className={styles.friendsHeroContent}>
              <div className={styles.friendsHeroLeft}>
                <div className={styles.modernUserCard}>
                  <Avatar
                    username={userData.user.username}
                    avatar={userData.user.avatar}
                    avatarType={userData.user.avatarType}
                    size="large"
                  />
                  <div className={styles.modernUserInfo}>
                    <h1 className={styles.friendsPageTitle}>
                      {userData.user.username}
                    </h1>
                    <p className={styles.friendsPageDescription}>
                      {userData.collections.length} collections •{" "}
                      {userData.collections.reduce(
                        (total, col) => total + col._count.vinyls,
                        0
                      )}{" "}
                      total records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collections Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Collections</h2>
              <p>Browse {userData.user.username}'s public record collections</p>
            </div>

            {userData.collections.length === 0 ? (
              <div className={styles.modernEmptyState}>
                <div className={styles.emptyStateIcon}>📚</div>
                <h3 className={styles.emptyStateTitle}>
                  No public collections
                </h3>
                <p className={styles.emptyStateDescription}>
                  This user hasn't made any collections public yet.
                </p>
              </div>
            ) : (
              <div className={styles.collectionGrid}>
                {userData.collections.map((collection) => (
                  <div key={collection.id} className={styles.card}>
                    <Link
                      href={`/users/${userData.user.id}/collections/${collection.id}`}
                    >
                      <div className={styles.imageContainer}>
                        {collection.vinyls.length > 0 &&
                        collection.vinyls[0].imageUrl ? (
                          <img
                            src={collection.vinyls[0].imageUrl}
                            alt={collection.title}
                            className={styles.albumArt}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder}>
                            <span style={{ fontSize: "2rem" }}>📚</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardInfo}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            {collection.title}
                          </h3>
                          {collection.description && (
                            <p className={styles.cardArtist}>
                              {collection.description}
                            </p>
                          )}
                        </div>
                        <p className={styles.addedDate}>
                          {collection._count.vinyls} records
                          {collection.isPublic && " • Public"}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
