type CacheEntry<T> = {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 60 * 1000 // 60 seconds

/**
 * Get a value from cache, or fetch it if expired/missing.
 * Uses a simple in-memory store with TTL-based revalidation.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const now = Date.now()
  const entry = cache.get(key) as CacheEntry<T> | undefined

  if (entry && now - entry.timestamp < ttl) {
    return entry.data
  }

  const data = await fetcher()
  cache.set(key, { data, timestamp: now })
  return data
}

/**
 * Invalidate a specific cache key (call after mutations).
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache keys that start with a given prefix.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Clear all cached data.
 */
export function clearAllCache(): void {
  cache.clear()
}

// Cache key constants for consistency
export const CACHE_KEYS = {
  PERSONS: "persons",
  TRANSACTIONS: "transactions",
  ACTIVITY_LOGS: "activity_logs",
  SETTLED_RECORDS: "settled_records",
  LOGIN_LOGS: "login_logs",
} as const
