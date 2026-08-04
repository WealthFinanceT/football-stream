import type { Match, Sport, Stream } from "@/types/streamed";

const STREAMED_BASE_URL = "https://streamed.pk/api";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

interface StreamedSportResponse {
  id?: string;
  name?: string;
}

interface StreamedMatchResponse {
  id?: string;
  title?: string;
  category?: string;
  date?: number;
  poster?: string;
  popular?: boolean;
  teams?: {
    home?: {
      name?: string;
      badge?: string;
    };
    away?: {
      name?: string;
      badge?: string;
    };
  };
  sources?: Array<{ source?: string; id?: string }>;
}

interface StreamedStreamResponse {
  id?: string;
  streamNo?: number;
  language?: string;
  hd?: boolean;
  embedUrl?: string;
  source?: string;
}

interface RequestJsonOptions {
  cache?: RequestCache;
  revalidate?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
}

function buildUrl(path: string) {
  return `${STREAMED_BASE_URL}${path}`;
}

function toSport(payload: StreamedSportResponse): Sport {
  return {
    id: payload.id ?? "",
    name: payload.name ?? "Unknown",
  };
}

function toMatch(payload: StreamedMatchResponse): Match {
  return {
    id: payload.id ?? "",
    title: payload.title ?? "Untitled match",
    category: payload.category ?? "Football",
    date: payload.date ?? Date.now(),
    poster: payload.poster,
    popular: payload.popular ?? false,
    teams: payload.teams,
    sources: (payload.sources ?? []).map((source) => ({
      source: source.source ?? "",
      id: source.id ?? "",
    })),
  };
}

function toStream(payload: StreamedStreamResponse): Stream {
  return {
    id: payload.id ?? "",
    streamNo: payload.streamNo ?? 0,
    language: payload.language ?? "Unknown",
    hd: payload.hd ?? false,
    embedUrl: payload.embedUrl ?? "",
    source: payload.source ?? "",
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson<T>(
  path: string,
  options: RequestJsonOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(buildUrl(path), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
        ...(options.cache ? { cache: options.cache } : {}),
        ...(typeof options.revalidate === "number"
          ? { next: { revalidate: options.revalidate } }
          : {}),
      });

      if (!response.ok) {
        throw new Error(
          `Streamed API request failed with status ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Streamed API request failed");
}

export async function getSports(): Promise<Sport[]> {
  const payload = await requestJson<StreamedSportResponse[]>('/sports', {
    revalidate: 30,
  });
  return payload.map(toSport);
}

export async function getLiveMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>('/matches/live', {
    revalidate: 30,
  });
  return payload.map(toMatch);
}

export async function getLivePopularMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>(
    '/matches/live/popular',
    { revalidate: 30 },
  );
  return payload.map(toMatch);
}

export async function getTodayMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>('/matches/all-today', {
    revalidate: 30,
  });
  return payload.map(toMatch);
}

export async function getAllMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>('/matches/all', {
    revalidate: 30,
  });

  const uniqueByIdMap = new Map<string, StreamedMatchResponse>();
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const key = String(item?.id ?? "");
      if (!uniqueByIdMap.has(key)) uniqueByIdMap.set(key, item);
    }
  }
  const uniquePayload = Array.from(uniqueByIdMap.values());

  return uniquePayload.map(toMatch);
}

export async function getMatchesBySport(sport: string): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>(
    `/matches/${encodeURIComponent(sport)}`,
    { revalidate: 30 },
  );
  return payload.map(toMatch);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const matches = await getAllMatches();

  const exact = matches.find((match) => match.id === id);
  if (exact) return exact;
  const slugify = (s?: string) =>
    (s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const tolerant = matches.find((match) => {
    if (!match.id) return false;

    if (id.includes(match.id)) return true;

    if (id.endsWith(`-${match.id}`)) return true;

    const titleSlug = slugify(match.title);
    if (titleSlug && (id === titleSlug || id.startsWith(`${titleSlug}-`)))
      return true;

    return false;
  });

  return tolerant ?? null;
}

export async function getStreamsBySource(
  source: string,
  id: string,
): Promise<Stream[]> {
  const payload = await requestJson<StreamedStreamResponse[]>(
    `/stream/${source}/${id}`,
    { cache: "no-store" },
  );

  const uniqueMap = new Map<string, StreamedStreamResponse>();
  if (Array.isArray(payload)) {
    for (const s of payload) {
      const key = `${s?.source ?? source}-${s?.id ?? ""}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, s);
    }
  }
  const uniquePayload = Array.from(uniqueMap.values());

  return uniquePayload.map(toStream);
}
