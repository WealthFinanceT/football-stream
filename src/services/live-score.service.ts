import type { Match } from "@/types/streamed";

export interface LiveScoreTeam {
  name: string;
  badge?: string;
}

export interface LiveScoreMatch {
  id: string;
  category: string;
  homeTeam: LiveScoreTeam;
  awayTeam: LiveScoreTeam;
  score: string;
  minute: string;
  status: "LIVE" | "HT" | "FT";
  matchUrl: string;
}

function extractScore(title?: string) {
  if (!title) return undefined;
  const match = title.match(/(\d+)\s*[-:\u2013]\s*(\d+)/);
  return match ? `${match[1]} - ${match[2]}` : undefined;
}

function getMatchMinute(date: number) {
  const elapsed = Math.max(0, Math.floor((Date.now() - date) / 60000));
  if (elapsed >= 120) return "90+'";
  return `${elapsed}'`;
}

async function requestLiveMatches(): Promise<Match[]> {
  const response = await fetch("/api/matches/live", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch live matches: ${response.status}`);
  }
  return (await response.json()) as Match[];
}

export async function fetchLiveScores(): Promise<LiveScoreMatch[]> {
  const payload = await requestLiveMatches();

  return payload
    .filter((match) => Boolean(match.teams?.home?.name || match.teams?.away?.name))
    .map((match) => ({
      id: match.id,
      category: match.category,
      homeTeam: {
        name: match.teams?.home?.name ?? "Home",
        badge: match.teams?.home?.badge,
      },
      awayTeam: {
        name: match.teams?.away?.name ?? "Away",
        badge: match.teams?.away?.badge,
      },
      score: extractScore(match.title) ?? "TBD",
      minute: getMatchMinute(match.date),
      status: "LIVE",
      matchUrl: `/matches/${match.id}`,
    }));
}
