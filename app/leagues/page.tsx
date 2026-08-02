"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, PlayCircle, Sparkles, Trophy } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMatchPath } from "@/lib/utils";
import { getMatchesBySport, getSports } from "@/services/streamed.service";
import type { Match, Sport } from "@/types/streamed";

export default function LeaguesPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const fetchedSports = await getSports();
        if (!active) return;

        setSports(fetchedSports);
        if (fetchedSports.length > 0) {
          const initialSport = fetchedSports[0].id;
          setSelectedSport(initialSport);
          const fetchedMatches = await getMatchesBySport(initialSport);
          if (active) {
            setMatches(fetchedMatches);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load leagues.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectSport = async (sportId: string) => {
    setSelectedSport(sportId);
    setLoading(true);
    try {
      const fetchedMatches = await getMatchesBySport(sportId);
      setMatches(fetchedMatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this league.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">
                GoalPulse
              </p>
              <p className="text-xs text-slate-500">Leagues</p>
            </div>
          </Link>

          <Button asChild variant="ghost" className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
            <Link href="/" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="Leagues"
          description="Explore football categories from the Streamed API and jump into matches for your favorite competition."
          className="border-white/10 bg-slate-950/70"
        />

        {error ? (
          <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardContent className="py-10 text-center text-slate-400">
              {error}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-emerald-400" />
                Sports & leagues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sports.length === 0 && !loading ? (
                <p className="text-sm text-slate-400">No leagues available right now.</p>
              ) : null}

              {sports.map((sport) => {
                const isActive = sport.id === selectedSport;

                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => void handleSelectSport(sport.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isActive ? "border-emerald-400/30 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  >
                    <span className="font-medium">{sport.name}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-white">
                  {selectedSport
                    ? sports.find((sport) => sport.id === selectedSport)?.name ?? "Selected league"
                    : "Matches"}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">
                  Browse matches for the selected league and jump into the stream.
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                {matches.length} matches
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                  Loading league matches...
                </div>
              ) : matches.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                  No matches are currently available for this league.
                </div>
              ) : (
                matches.slice(0, 8).map((match) => (
                  <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{match.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{match.category}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CalendarDays className="h-4 w-4 text-emerald-400" />
                        {new Date(match.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500">Live streams ready</span>
                      <Button asChild variant="outline" className="border-white/10 bg-slate-900/70 text-slate-200 hover:bg-slate-800">
                        <Link href={buildMatchPath(match.title, match.id)} className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Watch
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
