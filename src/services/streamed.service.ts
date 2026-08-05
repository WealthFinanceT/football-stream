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
  const requestUrl = buildUrl(path);
  const cacheOption = options.cache;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
        ...(cacheOption ? { cache: cacheOption } : {}),
        ...(typeof options.revalidate === "number"
          ? { next: { revalidate: options.revalidate } }
          : {}),
      });

      const responseText = await response.text();
      const bodyPreview = responseText.length > 1000 ? `${responseText.slice(0, 1000)}...` : responseText;

      if (!response.ok) {
        const message = `Streamed API request failed for ${requestUrl} with status ${response.status}`;
        if (process.env.NODE_ENV === "development") {
          console.debug("[Streamed API] request failed", {
            url: requestUrl,
            status: response.status,
            body: bodyPreview,
            cache: cacheOption,
            attempt,
          });
        }
        throw new Error(`${message}: ${bodyPreview}`);
      }

      if (!responseText) {
        const message = `Streamed API returned empty response for ${requestUrl}`;
        if (process.env.NODE_ENV === "development") {
          console.debug("[Streamed API] empty response", { url: requestUrl, cache: cacheOption, attempt });
        }
        throw new Error(message);
      }

      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        const message = `Failed to parse Streamed API response for ${requestUrl}`;
        if (process.env.NODE_ENV === "development") {
          console.debug("[Streamed API] parse error", {
            url: requestUrl,
            cache: cacheOption,
            attempt,
            body: bodyPreview,
            parseError,
          });
        }
        throw new Error(`${message}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
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

function extractMatchId(input: string): string | null {
  if (!input) return null;

  const digits = input.match(/(\d+)/g);
  if (!digits?.length) return null;

  return digits[digits.length - 1] ?? null;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const numericId = extractMatchId(id);
  const lookupId = numericId ?? id;

  try {
    const payload = await requestJson<StreamedMatchResponse>(
      `/matches/${encodeURIComponent(lookupId)}`,
      { cache: "no-store", maxAttempts: 2 },
    );

    if (!payload || typeof payload !== "object") return null;
    return toMatch(payload);
  } catch {
    return null;
  }
}

function buildStreamCandidates(source: string, id: string) {
  const seen = new Set<string>();
  const candidates: Array<{ source: string; id: string }> = [];

  const addCandidate = (candidateSource: string, candidateId: string) => {
    const key = `${candidateSource}:${candidateId}`;
    if (!candidateSource || !candidateId || seen.has(key)) return;
    seen.add(key);
    candidates.push({ source: candidateSource, id: candidateId });
  };

  const normalizedId = id.replace(/^ppv-/, "");
  const prefixedId = id.startsWith("ppv-") ? id : `ppv-${id}`;

  addCandidate(source, id);
  addCandidate(source, normalizedId);
  addCandidate(source, prefixedId);
  addCandidate("admin", id);
  addCandidate("admin", normalizedId);
  addCandidate("admin", prefixedId);
  addCandidate("ppv", id);
  addCandidate("ppv", normalizedId);
  addCandidate("ppv", prefixedId);

  return candidates;
}

export async function getStreamsBySource(
  source: string,
  id: string,
): Promise<Stream[]> {
  const candidates = buildStreamCandidates(source, id);

  for (const candidate of candidates) {
    const endpoints = [
      `/stream/${encodeURIComponent(candidate.source)}/${encodeURIComponent(candidate.id)}`,
      `/streams/${encodeURIComponent(candidate.source)}/${encodeURIComponent(candidate.id)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const payload = await requestJson<StreamedStreamResponse[]>(
          endpoint,
          { cache: "no-store", maxAttempts: 2 },
        );

        const uniqueMap = new Map<string, StreamedStreamResponse>();
        if (Array.isArray(payload)) {
          for (const s of payload) {
            const key = `${s?.source ?? candidate.source}-${s?.id ?? ""}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, s);
          }
        }

        const uniquePayload = Array.from(uniqueMap.values());
        const streams = uniquePayload.map(toStream).filter((stream) => Boolean(stream.embedUrl));
        if (streams.length > 0) {
          return streams;
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[streamed.service] getStreamsBySource endpoint failed", {
            source: candidate.source,
            id: candidate.id,
            endpoint,
            error,
          });
        }
        continue;
      }
    }
  }

  return [];
}
