interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
}

export class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      ...config,
    };
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldEntries() {
    if (this.cache.size <= this.config.maxSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(
      0,
      this.cache.size - this.config.maxSize + 1
    );
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.evictOldEntries();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Request deduplication - if same request is in flight, return the same promise
  async dedupedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already in flight
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make the request
    const promise = fetcher()
      .then((data) => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    };
  }
}

// Global cache instances with different TTL settings
export const userCache = new DataCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes for user data
  maxSize: 100,
});

export const collectionCache = new DataCache({
  defaultTTL: 2 * 60 * 1000, // 2 minutes for collection data
  maxSize: 500,
});

export const discogsCache = new DataCache({
  defaultTTL: 60 * 60 * 1000, // 1 hour for Discogs data (rarely changes)
  maxSize: 1000,
});

export const vinylCache = new DataCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for vinyl data
  maxSize: 1000,
});

// Cache utility functions
export const cacheKeys = {
  user: (id?: string) => (id ? `user:${id}` : "user:current"),
  collections: (userId?: string) =>
    userId ? `collections:${userId}` : "collections:current",
  collection: (id: string) => `collection:${id}`,
  vinyl: (id: string) => `vinyl:${id}`,
  vinylCollection: (filters?: string) =>
    `vinyl-collection${filters ? `:${filters}` : ""}`,
  discogsRelease: (id: string) => `discogs:release:${id}`,
  discogsSearch: (query: string) =>
    `discogs:search:${encodeURIComponent(query)}`,
  friends: (type?: string) => `friends${type ? `:${type}` : ""}`,
  userSearch: (query: string) => `user-search:${encodeURIComponent(query)}`,
};

// Cache invalidation helpers
export const invalidateCaches = {
  user: () => {
    userCache.invalidate("user:*");
  },
  collections: () => {
    collectionCache.invalidate("collections:*");
    collectionCache.invalidate("collection:*");
  },
  vinyl: () => {
    vinylCache.invalidate("vinyl:*");
    vinylCache.invalidate("vinyl-collection:*");
    collectionCache.invalidate("collections:*"); // Collections have vinyl counts
  },
  friends: () => {
    userCache.invalidate("friends:*");
  },
};
