import type { Match, Sport, Stream } from "@/types/streamed";

const STREAMED_BASE_URL = "https://streamed.pk/api";

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

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Streamed API request failed with status ${response.status}`);
  }

  // TEMP LOG: record raw response for tracing duplicates (remove after debugging)
  try {
    const raw = await response.clone().text();
    const contains = raw.includes("ppv-tottenham-hotspur-vs-tsg-hoffenheim");
    try {
      const parsed = JSON.parse(raw);
      const count = Array.isArray(parsed) ? parsed.filter((p) => String(p?.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length : 0;
      console.log(`[STREAMED_RAW] ${path} status=${response.status} len=${raw.length} hasTarget=${contains} occurrences=${count}`);
    } catch (e) {
      console.log(`[STREAMED_RAW] ${path} status=${response.status} len=${raw.length} hasTarget=${contains} (parse failed)`);
    }
  } catch (e) {
    console.log(`[STREAMED_RAW] ${path} status=${response.status} (failed to read body)`);
  }

  return (await response.json()) as T;
}

export async function getSports(): Promise<Sport[]> {
  const payload = await requestJson<StreamedSportResponse[]>("/sports");
  return payload.map(toSport);
}

export async function getLiveMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>("/matches/live");
  console.log(`[SERVICE] getLiveMatches -> payload.length=${payload?.length ?? 0} targetCount=${payload?.filter(p => String(p?.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length ?? 0}`);
  return payload.map(toMatch);
}

export async function getLivePopularMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>("/matches/live/popular");
  console.log(`[SERVICE] getLivePopularMatches -> payload.length=${payload?.length ?? 0} targetCount=${payload?.filter(p => String(p?.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length ?? 0}`);
  return payload.map(toMatch);
}

export async function getTodayMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>("/matches/all-today");
  console.log(`[SERVICE] getTodayMatches -> payload.length=${payload?.length ?? 0} targetCount=${payload?.filter(p => String(p?.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length ?? 0}`);
  return payload.map(toMatch);
}

export async function getAllMatches(): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>("/matches/all");

  // Detect duplicate occurrences for tracing (temporary)
  try {
    const targetId = "ppv-tottenham-hotspur-vs-tsg-hoffenheim";
    const matchesForTarget = Array.isArray(payload)
      ? payload.filter((p) => String(p?.id) === targetId)
      : [];
    if (matchesForTarget.length > 1) {
      console.log(`[SERVICE] getAllMatches -> payload.length=${payload?.length ?? 0} targetCount=${matchesForTarget.length}`);
      console.log(`[SERVICE] getAllMatches -> duplicate entries for ${targetId}:`, JSON.stringify(matchesForTarget, null, 2));
    }
  } catch (e) {
    console.log("[SERVICE] getAllMatches -> failed to inspect payload for duplicates", e);
  }

  // Deduplicate payload by `id` at the service layer to avoid rendering the same match twice
  const uniqueByIdMap = new Map<string, StreamedMatchResponse>();
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const key = String(item?.id ?? "");
      if (!uniqueByIdMap.has(key)) uniqueByIdMap.set(key, item);
    }
  }
  const uniquePayload = Array.from(uniqueByIdMap.values());

  if (uniquePayload.length !== (payload?.length ?? 0)) {
    console.log(`[SERVICE] getAllMatches -> deduped payload ${payload?.length ?? 0} -> ${uniquePayload.length}`);
  }

  return uniquePayload.map(toMatch);
}

export async function getMatchesBySport(sport: string): Promise<Match[]> {
  const payload = await requestJson<StreamedMatchResponse[]>(`/matches/${encodeURIComponent(sport)}`);
  return payload.map(toMatch);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const matches = await getAllMatches();

  // Exact match first
  const exact = matches.find((match) => match.id === id);
  if (exact) return exact;

  // Tolerant lookup for slug-style IDs like "team-a-vs-team-b-2395982"
  const slugify = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const tolerant = matches.find((match) => {
    if (!match.id) return false;

    // If the incoming id contains the numeric id
    if (id.includes(match.id)) return true;

    // If the incoming id ends with `-<id>`
    if (id.endsWith(`-${match.id}`)) return true;

    // Compare slugified title to the incoming id or its prefix
    const titleSlug = slugify(match.title);
    if (titleSlug && (id === titleSlug || id.startsWith(`${titleSlug}-`))) return true;

    return false;
  });

  return tolerant ?? null;
}

export async function getStreamsBySource(source: string, id: string): Promise<Stream[]> {
  const payload = await requestJson<StreamedStreamResponse[]>(`/stream/${source}/${id}`);

  // TEMP LOG + dedupe: some stream endpoints return duplicate stream entries
  try {
    const target = `${source}-${id}`;
    const occurrences = Array.isArray(payload) ? payload.filter((p) => `${p?.source ?? source}-${p?.id ?? ""}` === `${source}-${id}`).length : 0;
    if (occurrences > 1) {
      console.log(`[SERVICE] getStreamsBySource -> duplicate stream entries for ${target}: occurrences=${occurrences}`);
      console.log(JSON.stringify(payload, null, 2));
    }
  } catch (e) {
    console.log("[SERVICE] getStreamsBySource -> failed to inspect payload for duplicates", e);
  }

  // Deduplicate streams by source+id at service layer (matches UI key format)
  const uniqueMap = new Map<string, StreamedStreamResponse>();
  if (Array.isArray(payload)) {
    for (const s of payload) {
      const key = `${s?.source ?? source}-${s?.id ?? ""}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, s);
    }
  }
  const uniquePayload = Array.from(uniqueMap.values());

  if (uniquePayload.length !== (payload?.length ?? 0)) {
    console.log(`[SERVICE] getStreamsBySource -> deduped streams ${payload?.length ?? 0} -> ${uniquePayload.length} for ${source}/${id}`);
  }

  return uniquePayload.map(toStream);
}
