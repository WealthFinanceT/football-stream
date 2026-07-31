export interface StoredMatch {
  id: string;
  title: string;
  category?: string;
  viewedAt?: number;
}

export interface StoredSearch {
  id: string;
  value: string;
  createdAt?: number;
}

const isBrowser = typeof window !== "undefined";

export const FAVORITES_KEY = "favoriteMatches";
export const WATCH_HISTORY_KEY = "watchHistory";
export const RECENT_SEARCHES_KEY = "recentSearches";

function readStorage<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T[]) {
  if (!isBrowser) return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): StoredMatch[] {
  return readStorage<StoredMatch>(FAVORITES_KEY, []);
}

export function toggleFavorite(match: StoredMatch) {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === match.id);
  const next = exists
    ? favorites.filter((item) => item.id !== match.id)
    : [{ ...match, viewedAt: Date.now() }, ...favorites].slice(0, 10);

  writeStorage(FAVORITES_KEY, next);
  return next;
}

export function addToWatchHistory(match: StoredMatch) {
  const history = readStorage<StoredMatch>(WATCH_HISTORY_KEY, []);
  const next = [{ ...match, viewedAt: Date.now() }, ...history.filter((item) => item.id !== match.id)].slice(0, 8);
  writeStorage(WATCH_HISTORY_KEY, next);
  return next;
}

export function getWatchHistory(): StoredMatch[] {
  return readStorage<StoredMatch>(WATCH_HISTORY_KEY, []);
}

export function addRecentSearch(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const searches = readStorage<StoredSearch>(RECENT_SEARCHES_KEY, []);
  const next = [{ id: `${trimmed}-${Date.now()}`, value: trimmed, createdAt: Date.now() }, ...searches.filter((item) => item.value.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
  writeStorage(RECENT_SEARCHES_KEY, next);
  return next;
}

export function getRecentSearches(): StoredSearch[] {
  return readStorage<StoredSearch>(RECENT_SEARCHES_KEY, []);
}
