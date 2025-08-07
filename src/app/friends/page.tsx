"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "../components/Avatar";
import PageLoader from "../components/PageLoader";
import Button from "../components/Button";
import styles from "../page.module.css";

interface User {
  id: number;
  username: string;
  avatar?: string;
  avatarType?: string;
  friendshipStatus?: string;
}

interface Friend {
  id: number;
  status: string;
  createdAt: string;
  friend?: User;
  sender?: User;
  receiver?: User;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);

      // Fetch all friend data in parallel
      const [friendsRes, sentRes, receivedRes] = await Promise.all([
        fetch("/api/friends?type=friends"),
        fetch("/api/friends?type=sent"),
        fetch("/api/friends?type=received"),
      ]);

      if (!friendsRes.ok || !sentRes.ok || !receivedRes.ok) {
        if (friendsRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch friends data");
      }

      const [friendsData, sentData, receivedData] = await Promise.all([
        friendsRes.json(),
        sentRes.json(),
        receivedRes.json(),
      ]);

      setFriends(friendsData);
      setSentRequests(sentData);
      setReceivedRequests(receivedData);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError("Failed to load friends data");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (res.ok) {
        // Update search results
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, friendshipStatus: "sent" } : user
          )
        );
        // Refresh data
        fetchFriendsData();
      } else {
        const error = await res.json();
        setError(error.error || "Failed to send friend request");
      }
    } catch (error) {
      setError("Failed to send friend request");
    }
  };

  const respondToRequest = async (
    requestId: number,
    action: "accept" | "decline"
  ) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchFriendsData();
        setError(null);
      } else {
        const error = await res.json();
        setError(error.error || `Failed to ${action} friend request`);
      }
    } catch (error) {
      setError(`Failed to ${action} friend request`);
    }
  };

  const removeFriend = async (friendshipId: number) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFriendsData();
        setError(null);
      } else {
        const error = await res.json();
        setError(error.error || "Failed to remove friend");
      }
    } catch (error) {
      setError("Failed to remove friend");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  if (loading) {
    return <PageLoader text="Loading friends..." />;
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          {/* Friends Hero Section */}
          <div className={styles.friendsHeroSection}>
            <div className={styles.friendsHeroContent}>
              <div className={styles.friendsHeroLeft}>
                <h1 className={styles.friendsPageTitle}>Friends</h1>
                <p className={styles.friendsPageDescription}>
                  Connect with other vinyl collectors and discover their
                  collections
                </p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className={styles.searchSection}>
            <div className={styles.searchHeader}>
              <h2 className={styles.plainSectionTitle}>Find Friends</h2>
            </div>
            <div className={styles.modernSearchContainer}>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.modernFilterInput}
              />
              {isSearching && (
                <div className={styles.searchingIndicator}>Searching...</div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <h3 className={styles.resultsTitle}>Search Results</h3>
                <div className={styles.modernUsersList}>
                  {searchResults.map((user) => (
                    <div key={user.id} className={styles.modernUserCard}>
                      <Avatar
                        username={user.username}
                        avatar={user.avatar}
                        avatarType={user.avatarType}
                        size="medium"
                      />
                      <div className={styles.modernUserInfo}>
                        <h4 className={styles.userName}>{user.username}</h4>
                        <div className={styles.modernUserActions}>
                          {user.friendshipStatus === "none" && (
                            <Button
                              onClick={() => sendFriendRequest(user.id)}
                              variant="primary"
                              size="small"
                            >
                              Add Friend
                            </Button>
                          )}
                          {user.friendshipStatus === "sent" && (
                            <span className={styles.statusText}>
                              Request Sent
                            </span>
                          )}
                          {user.friendshipStatus === "received" && (
                            <span className={styles.statusText}>
                              Sent You Request
                            </span>
                          )}
                          {user.friendshipStatus === "friends" && (
                            <Link href={`/users/${user.id}`}>
                              <Button variant="outline" size="small">
                                View Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Friends Management Section */}
          <div className={styles.friendsManagementSection}>
            <div className={styles.friendsManagementHeader}>
              <h2 className={styles.sectionTitle}>Your Friends</h2>
            </div>
            {error && <div className={styles.modernErrorMessage}>{error}</div>}

            {/* Modern Tabs */}
            <div className={styles.modernTabNav}>
              <button
                onClick={() => setActiveTab("friends")}
                className={
                  activeTab === "friends"
                    ? styles.modernTabActive
                    : styles.modernTabInactive
                }
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={
                  activeTab === "received"
                    ? styles.modernTabActive
                    : styles.modernTabInactive
                }
              >
                Requests ({receivedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab("sent")}
                className={
                  activeTab === "sent"
                    ? styles.modernTabActive
                    : styles.modernTabInactive
                }
              >
                Sent ({sentRequests.length})
              </button>
            </div>

            <div className={styles.modernTabContent}>
              {/* Friends Tab */}
              {activeTab === "friends" && (
                <div className={styles.modernFriendsList}>
                  {friends.length === 0 ? (
                    <div className={styles.modernEmptyState}>
                      <div className={styles.emptyStateIcon}>👥</div>
                      <h3 className={styles.emptyStateTitle}>No friends yet</h3>
                      <p className={styles.emptyStateDescription}>
                        Start by searching for users above!
                      </p>
                    </div>
                  ) : (
                    friends.map((friendship) => (
                      <div
                        key={friendship.id}
                        className={styles.modernFriendCard}
                      >
                        <Link
                          href={`/users/${friendship.friend?.id}`}
                          className={styles.friendCardLink}
                        >
                          <Avatar
                            username={friendship.friend?.username || ""}
                            avatar={friendship.friend?.avatar}
                            avatarType={friendship.friend?.avatarType}
                            size="medium"
                          />
                          <div className={styles.modernFriendInfo}>
                            <h4 className={styles.friendName}>
                              {friendship.friend?.username}
                            </h4>
                            <p className={styles.friendMeta}>
                              Friends since{" "}
                              {new Date(
                                friendship.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                        <div className={styles.modernFriendActions}>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFriend(friendship.id);
                            }}
                            variant="danger"
                            size="small"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Received Requests Tab */}
              {activeTab === "received" && (
                <div className={styles.modernRequestsList}>
                  {receivedRequests.length === 0 ? (
                    <div className={styles.modernEmptyState}>
                      <div className={styles.emptyStateIcon}>📨</div>
                      <h3 className={styles.emptyStateTitle}>
                        No pending requests
                      </h3>
                      <p className={styles.emptyStateDescription}>
                        You don't have any friend requests right now.
                      </p>
                    </div>
                  ) : (
                    receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className={styles.modernRequestCard}
                      >
                        <Avatar
                          username={request.sender?.username || ""}
                          avatar={request.sender?.avatar}
                          avatarType={request.sender?.avatarType}
                          size="medium"
                        />
                        <div className={styles.modernRequestInfo}>
                          <h4 className={styles.requestName}>
                            {request.sender?.username}
                          </h4>
                          <p className={styles.requestMeta}>
                            Sent{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={styles.modernRequestActions}>
                          <Button
                            onClick={() =>
                              respondToRequest(request.id, "accept")
                            }
                            variant="primary"
                            size="small"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() =>
                              respondToRequest(request.id, "decline")
                            }
                            variant="outline"
                            size="small"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sent Requests Tab */}
              {activeTab === "sent" && (
                <div className={styles.modernSentList}>
                  {sentRequests.length === 0 ? (
                    <div className={styles.modernEmptyState}>
                      <div className={styles.emptyStateIcon}>📤</div>
                      <h3 className={styles.emptyStateTitle}>
                        No sent requests
                      </h3>
                      <p className={styles.emptyStateDescription}>
                        You haven't sent any friend requests yet.
                      </p>
                    </div>
                  ) : (
                    sentRequests.map((request) => (
                      <div key={request.id} className={styles.modernSentCard}>
                        <Avatar
                          username={request.receiver?.username || ""}
                          avatar={request.receiver?.avatar}
                          avatarType={request.receiver?.avatarType}
                          size="medium"
                        />
                        <div className={styles.modernSentInfo}>
                          <h4 className={styles.sentName}>
                            {request.receiver?.username}
                          </h4>
                          <p className={styles.sentMeta}>
                            Sent{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={styles.modernSentActions}>
                          <Button
                            onClick={() => removeFriend(request.id)}
                            variant="outline"
                            size="small"
                          >
                            Cancel Request
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
