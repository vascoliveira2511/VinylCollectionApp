import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function useCache() {
  const router = useRouter();

  const handleCachedRequest = async <T>(
    request: () => Promise<T>,
    options: {
      onUnauthorized?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    try {
      return await request();
    } catch (error) {
      if (error instanceof Error) {
        // Handle 401 errors by redirecting to login
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          if (options.onUnauthorized) {
            options.onUnauthorized();
          } else {
            router.push("/login");
          }
          return null;
        }

        if (options.onError) {
          options.onError(error);
        } else {
          console.error("Cache request failed:", error);
        }
      }
      throw error;
    }
  };

  return {
    handleCachedRequest,

    // Common cached requests
    getCurrentUser: (options?: {
      cache?: "no-cache" | "force-refresh";
      ttl?: number;
    }) => handleCachedRequest(() => apiClient.getCurrentUser(options || {})),

    getCollections: (options?: {
      cache?: "no-cache" | "force-refresh";
      ttl?: number;
    }) => handleCachedRequest(() => apiClient.getCollections(options || {})),

    getVinylCollection: (
      filters?: Record<string, string>,
      options?: { cache?: "no-cache" | "force-refresh"; ttl?: number }
    ) =>
      handleCachedRequest(() =>
        apiClient.getVinylCollection(filters, options || {})
      ),

    getCacheStats: () => apiClient.getCacheStats(),
    clearAllCaches: () => apiClient.clearAllCaches(),
  };
}

// Hook for handling loading states with cached data
export function useCachedData<T>(
  fetcher: () => Promise<T | null>,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => fetcher() };
}

// React import for the custom hook
import React from "react";
