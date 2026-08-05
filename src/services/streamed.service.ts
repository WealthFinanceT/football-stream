import type { Match as MatchType, Sport as SportType, Stream as StreamType } from "@/types/streamed";

const STREAMED_BASE_URL = "https://streamed.pk/api";
const DEFAULT_TIMEOUT_MS = 8000;

type RequestCacheOption = RequestCache | undefined;

interface RequestOptions {
  cache?: RequestCacheOption;
  revalidate?: number;
  timeoutMs?: number;
}

function buildUrl(path: string) {
  return `${STREAMED_BASE_URL}${path}`;
}

async function timeoutFetch(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path);
  const init: RequestInit = {
    method: "GET",
    headers: { Accept: "application/json" },
    ...(options.cache ? { cache: options.cache } : {}),
  };

  // Next.js revalidate support
  if (typeof options.revalidate === "number") {
    // Use fetch with next option when available in runtime; keep init as-is for browsers
  }

  const res = await timeoutFetch(url, init, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (!text) throw new Error("Empty response");
  return JSON.parse(text) as T;
}

function isPlayableUrl(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSport(payload: unknown): SportType {
  const p = payload as Record<string, unknown>;
  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? ""),
  };
}

function normalizeMatch(payload: unknown): MatchType {
  const p = payload as Record<string, unknown>;
  const teams = ((): MatchType["teams"] => {
    const t = p.teams as unknown;
    if (!t || typeof t !== "object") return undefined;
    return t as MatchType["teams"];
  })();

  const sources = (() => {
    const src = p.sources as unknown;
    if (!Array.isArray(src)) return [] as Array<{ source: string; id: string }>;
    return src.map((s) => {
      const r = s as Record<string, unknown>;
      return { source: String(r.source ?? ""), id: String(r.id ?? "") };
    });
  })();

  return {
    id: String(p.id ?? ""),
    title: String(p.title ?? ""),
    category: String(p.category ?? ""),
    date: Number(p.date ?? Date.now()),
    poster: typeof p.poster === "string" && p.poster.length ? String(p.poster) : undefined,
    popular: Boolean(p.popular ?? false),
    teams,
    sources,
  };
}

function normalizeStream(payload: unknown): StreamType {
  const p = payload as Record<string, unknown>;
  return {
    id: String(p.id ?? ""),
    streamNo: Number(p.streamNo ?? 0),
    language: String(p.language ?? ""),
    hd: Boolean(p.hd ?? false),
    embedUrl: String(p.embedUrl ?? ""),
    source: String(p.source ?? ""),
  };
}

export async function getSports(): Promise<SportType[]> {
  const payload = await requestJson<unknown[]>("/sports", { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeSport);
}

export async function getLiveMatches(): Promise<MatchType[]> {
  const payload = await requestJson<unknown[]>("/matches/live", { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeMatch);
}

export async function getLivePopularMatches(): Promise<MatchType[]> {
  const payload = await requestJson<unknown[]>("/matches/live/popular", { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeMatch);
}

export async function getTodayMatches(): Promise<MatchType[]> {
  const payload = await requestJson<unknown[]>("/matches/all-today", { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeMatch);
}

export async function getAllMatches(): Promise<MatchType[]> {
  const payload = await requestJson<unknown[]>("/matches/all", { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  // dedupe by id
  const map = new Map<string, unknown>();
  for (const item of payload) {
    const record = item as Record<string, unknown>;
    const id = String(record.id ?? "");
    if (!map.has(id)) map.set(id, item);
  }
  return Array.from(map.values()).map(normalizeMatch);
}

export async function getMatchesBySport(sport: string): Promise<MatchType[]> {
  const payload = await requestJson<unknown[]>(`/matches/${encodeURIComponent(sport)}`, { revalidate: 30 });
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeMatch);
}

export async function getMatchById(id: string): Promise<MatchType | null> {
  if (!id) return null;
  try {
    const payload = await requestJson<unknown>(`/matches/${encodeURIComponent(id)}`, { cache: "no-store", timeoutMs: 5000 });
    if (!payload || typeof payload !== "object") return null;
    return normalizeMatch(payload);
  } catch {
    return null;
  }
}

async function fetchStreamsEndpoint(endpoint: string): Promise<StreamType[]> {
  try {
    const payload = await requestJson<unknown[]>(endpoint, { cache: "no-store", timeoutMs: 7000 });
    if (!Array.isArray(payload)) return [];
    const streams = payload.map(normalizeStream).filter((s) => isPlayableUrl(s.embedUrl));
    return streams;
  } catch {
    return [];
  }
}

export async function getStreamsBySource(source: string, id: string): Promise<StreamType[]> {
  if (!source || !id) return [];
  const candidates = [
    `/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
    `/streams/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
  ];

  for (const endpoint of candidates) {
    const streams = await fetchStreamsEndpoint(endpoint);
    if (streams.length > 0) return streams;
  }

  // try some common fallbacks (ppv/admin variants)
  const altSources = ["admin", "ppv"];
  for (const alt of altSources) {
    for (const endpoint of [
      `/stream/${encodeURIComponent(alt)}/${encodeURIComponent(id)}`,
      `/streams/${encodeURIComponent(alt)}/${encodeURIComponent(id)}`,
    ]) {
      const streams = await fetchStreamsEndpoint(endpoint);
      if (streams.length > 0) return streams;
    }
  }

  return [];
}

/**
 * Try each source in `match.sources` until one returns playable streams.
 * For live matches, retries up to `maxRetries` with `retryDelayMs` between attempts.
 */
export async function getWorkingStreams(match: MatchType, opts?: { maxRetries?: number; retryDelayMs?: number }): Promise<StreamType[]> {
  if (!match) return [];
  const sources = Array.isArray(match.sources) ? match.sources : [];
  if (sources.length === 0) return [];

  const maxRetries = opts?.maxRetries ?? (match.popular ? 3 : 1);
  const retryDelayMs = opts?.retryDelayMs ?? 20000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const s of sources) {
      try {
        const streams = await getStreamsBySource(s.source, s.id);
        if (streams.length > 0) return streams;
      } catch {
        // continue to next source
        continue;
      }
    }

    // if no streams and this is a live match, wait then retry
    if (attempt < maxRetries - 1 && match.popular) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  return [];
}

const StreamedService = {
  getSports,
  getLiveMatches,
  getLivePopularMatches,
  getTodayMatches,
  getAllMatches,
  getMatchesBySport,
  getMatchById,
  getStreamsBySource,
  getWorkingStreams,
};

export default StreamedService;
