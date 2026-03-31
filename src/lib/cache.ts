/**
 * Simple in-memory TTL cache for serverless.
 * Each warm instance keeps its own cache; cold starts get fresh data.
 * Good enough for caching plant context per region (~minutes of freshness).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Get or set a cached value. If the key doesn't exist or is expired,
 * the factory function is called to produce a fresh value.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = await factory();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix: string) {
  // Exact match
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix);
    return;
  }

  // Prefix match
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
}
