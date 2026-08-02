import Link from "next/link";
import { getLiveMatches } from "@/services/streamed.service";
import { MatchCard } from "@/components/common/MatchCard";
import type { Match } from "@/types/streamed";

function formatDate(date: number) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function fetchLiveMatches() {
  return await getLiveMatches();
}

export default async function LiveMatchesPage() {
  let matches: Match[] = [];
  let error: string | null = null;

  try {
    matches = await fetchLiveMatches();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load live matches.";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Live Matches</p>
              <h1 className="mt-3 text-4xl font-semibold text-foreground">Current football action</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Browse all live matches from the official Streamed API live endpoint.</p>
            </div>
            <Link
              href="/matches"
              className="inline-flex rounded-full border border-white/10 bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              Back to Matches
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Unable to load live matches</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No live matches right now</p>
            <p className="mt-2 text-sm text-slate-400">Check back shortly for new live sports fixtures.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`} className="block">
                <MatchCard
                  title={match.title}
                  subtitle={match.category}
                  time={formatDate(match.date)}
                  league={match.category}
                  live
                  homeTeam={match.teams?.home?.name ?? "Home"}
                  awayTeam={match.teams?.away?.name ?? "Away"}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
