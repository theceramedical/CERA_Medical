/**
 * Short-TTL catalogue cache with stale-while-revalidate.
 *
 * Valkey when VALKEY_URL is set; in-process memory otherwise (tests, and a
 * Vendure restart must not blank the services section). Invalidation is
 * explicit: a seed or a staff publish of availability copy deletes the key.
 */

export interface CatalogueCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

export function memoryCatalogueCache(now: () => number = Date.now): CatalogueCache {
  const store = new Map<string, MemoryEntry>();

  return {
    get(key) {
      const entry = store.get(key);
      if (entry === undefined) return Promise.resolve(null);
      if (entry.expiresAt <= now()) {
        store.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value);
    },
    set(key, value, ttlSeconds) {
      store.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
      return Promise.resolve();
    },
    del(key) {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

const CATALOGUE_TTL_SECONDS = 60;
const LIST_KEY = 'catalogue:services';
const itemKey = (slug: string): string => `catalogue:service:${slug}`;

export function catalogueKeys() {
  return { LIST_KEY, itemKey, CATALOGUE_TTL_SECONDS };
}
