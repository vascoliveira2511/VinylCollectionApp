"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "../components/Avatar";
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
    return (
      <main className={styles.main}>
        <div className="container">
          <div className="window">
            <div className="title-bar">Loading...</div>
            <div className={styles.contentSection}>
              <p>Loading friends...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Search Section */}
        <div className="window">
          <div className="title-bar">Find Friends</div>
          <div className={styles.contentSection}>
            <div className={styles.inputContainer}>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              {isSearching && (
                <div className={styles.searchingIndicator}>Searching...</div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <h3>Search Results</h3>
                <div className={styles.usersList}>
                  {searchResults.map((user) => (
                    <div key={user.id} className={styles.userCard}>
                      <Avatar
                        username={user.username}
                        avatar={user.avatar}
                        avatarType={user.avatarType}
                        size="medium"
                      />
                      <div className={styles.userInfo}>
                        <h4>{user.username}</h4>
                        <div className={styles.userActions}>
                          {user.friendshipStatus === "none" && (
                            <button
                              onClick={() => sendFriendRequest(user.id)}
                              className={styles.addButton}
                            >
                              Add Friend
                            </button>
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
                            <Link
                              href={`/users/${user.id}`}
                              className={styles.viewButton}
                            >
                              View Profile
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
        </div>

        {/* Friends Management */}
        <div className="window">
          <div className="title-bar">Friends</div>
          <div className={styles.contentSection}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Tabs */}
            <div className={styles.tabNav}>
              <button
                onClick={() => setActiveTab("friends")}
                className={
                  activeTab === "friends"
                    ? styles.tabActive
                    : styles.tabInactive
                }
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={
                  activeTab === "received"
                    ? styles.tabActive
                    : styles.tabInactive
                }
              >
                Requests ({receivedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab("sent")}
                className={
                  activeTab === "sent" ? styles.tabActive : styles.tabInactive
                }
              >
                Sent ({sentRequests.length})
              </button>
            </div>

            <div className={styles.tabContent}>
              {/* Friends Tab */}
              {activeTab === "friends" && (
                <div className={styles.friendsList}>
                  {friends.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No friends yet. Start by searching for users above!</p>
                    </div>
                  ) : (
                    friends.map((friendship) => (
                      <div key={friendship.id} className={styles.friendCard}>
                        <Avatar
                          username={friendship.friend?.username || ""}
                          avatar={friendship.friend?.avatar}
                          avatarType={friendship.friend?.avatarType}
                          size="medium"
                        />
                        <div className={styles.friendInfo}>
                          <h4>{friendship.friend?.username}</h4>
                          <p>
                            Friends since{" "}
                            {new Date(
                              friendship.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={styles.friendActions}>
                          <Link
                            href={`/users/${friendship.friend?.id}`}
                            className={styles.viewButton}
                          >
                            View Collections
                          </Link>
                          <button
                            onClick={() => removeFriend(friendship.id)}
                            className={styles.deleteButton}
                          >
                            Remove Friend
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Received Requests Tab */}
              {activeTab === "received" && (
                <div className={styles.requestsList}>
                  {receivedRequests.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No pending friend requests.</p>
                    </div>
                  ) : (
                    receivedRequests.map((request) => (
                      <div key={request.id} className={styles.requestCard}>
                        <Avatar
                          username={request.sender?.username || ""}
                          avatar={request.sender?.avatar}
                          avatarType={request.sender?.avatarType}
                          size="medium"
                        />
                        <div className={styles.requestInfo}>
                          <h4>{request.sender?.username}</h4>
                          <p>
                            Sent{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={styles.requestActions}>
                          <button
                            onClick={() =>
                              respondToRequest(request.id, "accept")
                            }
                            className={styles.addButton}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              respondToRequest(request.id, "decline")
                            }
                            className={styles.cancelButton}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sent Requests Tab */}
              {activeTab === "sent" && (
                <div className={styles.sentList}>
                  {sentRequests.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No pending sent requests.</p>
                    </div>
                  ) : (
                    sentRequests.map((request) => (
                      <div key={request.id} className={styles.sentCard}>
                        <Avatar
                          username={request.receiver?.username || ""}
                          avatar={request.receiver?.avatar}
                          avatarType={request.receiver?.avatarType}
                          size="medium"
                        />
                        <div className={styles.sentInfo}>
                          <h4>{request.receiver?.username}</h4>
                          <p>
                            Sent{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={styles.sentActions}>
                          <button
                            onClick={() => removeFriend(request.id)}
                            className={styles.cancelButton}
                          >
                            Cancel Request
                          </button>
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
