import {
  userCache,
  collectionCache,
  discogsCache,
  vinylCache,
  cacheKeys,
  invalidateCaches,
} from "./cache";

interface FetchOptions extends Omit<RequestInit, "cache"> {
  cache?: "no-cache" | "force-refresh";
  ttl?: number;
}

class CachedAPIClient {
  private async cachedFetch<T>(
    url: string,
    cacheKey: string,
    cache: any,
    options: FetchOptions = {}
  ): Promise<T> {
    const { cache: cacheOption, ttl, ...fetchOptions } = options;

    // Force refresh or no-cache
    if (cacheOption === "force-refresh" || cacheOption === "no-cache") {
      const response = await fetch(url, fetchOptions);
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();

      if (cacheOption !== "no-cache") {
        cache.set(cacheKey, data, ttl);
      }
      return data;
    }

    // Use deduped fetch with caching
    return cache.dedupedFetch(
      cacheKey,
      async () => {
        const response = await fetch(url, fetchOptions);
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
      ttl
    );
  }

  // User API
  async getCurrentUser(options: FetchOptions = {}) {
    return this.cachedFetch(
      "/api/auth/user",
      cacheKeys.user(),
      userCache,
      options
    );
  }

  async logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    invalidateCaches.user();
    return response;
  }

  async updateAvatar(avatarData: any) {
    const response = await fetch("/api/auth/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avatarData),
    });
    if (response.ok) {
      invalidateCaches.user();
    }
    return response.json();
  }

  async updatePreferences(preferences: any) {
    const response = await fetch("/api/auth/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    if (response.ok) {
      invalidateCaches.user();
    }
    return response.json();
  }

  // Collections API
  async getCollections(options: FetchOptions = {}) {
    return this.cachedFetch(
      "/api/collections",
      cacheKeys.collections(),
      collectionCache,
      options
    );
  }

  async getCollection(id: string, options: FetchOptions = {}) {
    return this.cachedFetch(
      `/api/collections/${id}`,
      cacheKeys.collection(id),
      collectionCache,
      options
    );
  }

  async createCollection(collectionData: any) {
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectionData),
    });

    if (response.ok) {
      invalidateCaches.collections();
    }

    return response.json();
  }

  async updateCollection(id: string, collectionData: any) {
    const response = await fetch(`/api/collections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectionData),
    });

    if (response.ok) {
      invalidateCaches.collections();
      collectionCache.delete(cacheKeys.collection(id));
    }

    return response.json();
  }

  async deleteCollection(id: string) {
    const response = await fetch(`/api/collections/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      invalidateCaches.collections();
    }

    return response;
  }

  async setDefaultCollection(collectionId: number) {
    const response = await fetch("/api/collections/set-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });

    if (response.ok) {
      invalidateCaches.collections();
    }

    return response.json();
  }

  // Vinyl API
  async getVinylCollection(
    filters?: Record<string, string>,
    options: FetchOptions = {}
  ) {
    const params = filters ? new URLSearchParams(filters).toString() : "";
    const url = `/api/collection${params ? `?${params}` : ""}`;
    const cacheKey = cacheKeys.vinylCollection(params);

    return this.cachedFetch(url, cacheKey, vinylCache, options);
  }

  async getVinyl(id: string, options: FetchOptions = {}) {
    return this.cachedFetch(
      `/api/collection/${id}`,
      cacheKeys.vinyl(id),
      vinylCache,
      options
    );
  }

  async addVinyl(vinylData: any) {
    const response = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vinylData),
    });

    if (response.ok) {
      invalidateCaches.vinyl();
      invalidateCaches.collections();
      invalidateCaches.user();
    }

    return response.json();
  }

  async updateVinyl(id: string, vinylData: any) {
    const response = await fetch(`/api/collection/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vinylData),
    });

    if (response.ok) {
      invalidateCaches.vinyl();
      vinylCache.delete(cacheKeys.vinyl(id));
    }

    return response.json();
  }

  async deleteVinyl(id: string) {
    const response = await fetch(`/api/collection/${id}`, { method: "DELETE" });

    if (response.ok) {
      invalidateCaches.vinyl();
      invalidateCaches.collections();
      invalidateCaches.user();
    }

    return response;
  }

  // Discogs API
  async getDiscogsRelease(id: string, options: FetchOptions = {}) {
    return this.cachedFetch(
      `/api/discogs/release/${id}`,
      cacheKeys.discogsRelease(id),
      discogsCache,
      { ttl: 60 * 60 * 1000, ...options } // 1 hour cache for Discogs data
    );
  }

  async searchDiscogs(query: string, options: FetchOptions = {}) {
    return this.cachedFetch(
      `/api/discogs-suggest?query=${encodeURIComponent(query)}`,
      cacheKeys.discogsSearch(query),
      discogsCache,
      { ttl: 30 * 60 * 1000, ...options } // 30 minutes cache for search results
    );
  }

  async getDiscogsData(
    artist: string,
    title: string,
    options: FetchOptions = {}
  ) {
    const cacheKey = `discogs:data:${encodeURIComponent(
      artist
    )}:${encodeURIComponent(title)}`;
    return this.cachedFetch(
      `/api/discogs?artist=${encodeURIComponent(
        artist
      )}&title=${encodeURIComponent(title)}`,
      cacheKey,
      discogsCache,
      { ttl: 60 * 60 * 1000, ...options } // 1 hour cache
    );
  }

  async searchDiscogsAdvanced(filters: any, options: FetchOptions = {}) {
    const cacheKey = `discogs:search-advanced:${JSON.stringify(filters)}`;
    return this.cachedFetch("/api/discogs/search", cacheKey, discogsCache, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
      ttl: 15 * 60 * 1000, // 15 minutes cache for search results
      ...options,
    });
  }

  // Friends API
  async getFriends(
    type?: "friends" | "sent" | "received",
    options: FetchOptions = {}
  ) {
    const url = `/api/friends${type ? `?type=${type}` : ""}`;
    return this.cachedFetch(url, cacheKeys.friends(type), userCache, options);
  }

  async searchUsers(query: string, options: FetchOptions = {}) {
    return this.cachedFetch(
      `/api/users/search?q=${encodeURIComponent(query)}`,
      cacheKeys.userSearch(query),
      userCache,
      { ttl: 2 * 60 * 1000, ...options } // 2 minutes cache for user search
    );
  }

  async sendFriendRequest(userId: number) {
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });

    if (response.ok) {
      invalidateCaches.friends();
    }

    return response.json();
  }

  async respondToFriendRequest(
    requestId: number,
    action: "accept" | "decline"
  ) {
    const response = await fetch(`/api/friends/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (response.ok) {
      invalidateCaches.friends();
    }

    return response.json();
  }

  async removeFriend(friendshipId: number) {
    const response = await fetch(`/api/friends/${friendshipId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      invalidateCaches.friends();
    }

    return response;
  }

  // Sync operations
  async syncDiscogsCollection() {
    const response = await fetch("/api/discogs/sync-collection", {
      method: "POST",
    });

    if (response.ok) {
      invalidateCaches.vinyl();
      invalidateCaches.collections();
      invalidateCaches.user();
    }

    return response.json();
  }

  async cleanupDuplicates() {
    const response = await fetch("/api/discogs/cleanup-duplicates", {
      method: "POST",
    });

    if (response.ok) {
      invalidateCaches.vinyl();
      invalidateCaches.collections();
      invalidateCaches.user();
    }

    return response.json();
  }

  // Cache management
  getCacheStats() {
    return {
      user: userCache.getStats(),
      collection: collectionCache.getStats(),
      discogs: discogsCache.getStats(),
      vinyl: vinylCache.getStats(),
    };
  }

  clearAllCaches() {
    userCache.clear();
    collectionCache.clear();
    discogsCache.clear();
    vinylCache.clear();
  }
}

export const apiClient = new CachedAPIClient();

// Export for direct use in components
export { invalidateCaches, cacheKeys };
