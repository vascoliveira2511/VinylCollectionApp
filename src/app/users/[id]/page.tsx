"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "../../components/Avatar";
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
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Loading...</div>
            <div className={styles.contentSection}>
              <p>Loading user profile...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !userData) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Error</div>
            <div className={styles.contentSection}>
              <div className={styles.errorMessage}>
                {error || "User not found"}
              </div>
              <div className={styles.formActions}>
                <Link href="/friends" className={styles.backButton}>
                  ← Back to Friends
                </Link>
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
        {/* User Profile Header */}
        <div className="window">
          <div className="title-bar">User Profile</div>
          <div className={styles.contentSection}>
            <div className={styles.userProfileHeader}>
              <Avatar
                username={userData.user.username}
                avatar={userData.user.avatar}
                avatarType={userData.user.avatarType}
                size="large"
              />
              <div className={styles.userProfileInfo}>
                <h1>{userData.user.username}</h1>
                <p>
                  {userData.collections.length} collections •{" "}
                  {userData.collections.reduce(
                    (total, col) => total + col._count.vinyls,
                    0
                  )}{" "}
                  total records
                </p>
              </div>
            </div>

            <div className={styles.formActions}>
              <Link href="/friends" className={styles.backButton}>
                ← Back to Friends
              </Link>
            </div>
          </div>
        </div>

        {/* User's Collections */}
        <div className="window">
          <div className="title-bar">Collections</div>
          <div className={styles.contentSection}>
            {userData.collections.length === 0 ? (
              <div className={styles.emptyState}>
                <p>This user has no public collections.</p>
              </div>
            ) : (
              <div className={styles.collectionsGrid}>
                {userData.collections.map((collection) => (
                  <div key={collection.id} className={styles.collectionCard}>
                    <Link
                      href={`/users/${userData.user.id}/collections/${collection.id}`}
                    >
                      <div className={styles.collectionPreview}>
                        {collection.vinyls.length > 0 ? (
                          <div className={styles.vinylPreviewGrid}>
                            {collection.vinyls
                              .slice(0, 3)
                              .map((vinyl, index) => (
                                <div
                                  key={vinyl.id}
                                  className={styles.vinylPreview}
                                >
                                  {vinyl.imageUrl ? (
                                    <img
                                      src={vinyl.imageUrl}
                                      alt={`${vinyl.artist} - ${vinyl.title}`}
                                      className={styles.previewAlbumArt}
                                    />
                                  ) : (
                                    <div className={styles.placeholderArt}>
                                      [Album]
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className={styles.emptyCollection}>
                            Empty Collection
                          </div>
                        )}
                      </div>

                      <div className={styles.collectionInfo}>
                        <h3>{collection.title}</h3>
                        {collection.description && (
                          <p className={styles.collectionDescription}>
                            {collection.description}
                          </p>
                        )}
                        <div className={styles.collectionStats}>
                          {collection._count.vinyls} records
                          {collection.isPublic && (
                            <span className={styles.publicBadge}>Public</span>
                          )}
                        </div>
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
