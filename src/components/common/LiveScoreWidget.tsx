"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, PlayCircle } from "lucide-react";
import { fetchLiveScores, LiveScoreMatch } from "@/services/live-score.service";

const POLL_INTERVAL = 30000;

function teamBadgeUrl(badge?: string) {
  return badge
    ? `https://streamed.pk/api/images/badge/${badge}.webp`
    : undefined;
}

function formatShortName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LiveScoreWidget() {
  const [matches, setMatches] = useState<LiveScoreMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedScores, setUpdatedScores] = useState<Record<string, string>>({});

  const hasMatches = matches.length > 0;

  const visibleMatches = useMemo(() => matches.slice(0, 6), [matches]);

  const loadLiveScores = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchLiveScores();
      const newScores: Record<string, string> = {};
      for (const match of data) {
        newScores[match.id] = match.score;
      }
      setUpdatedScores(newScores);
      setMatches(data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load live score data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refresh = () => {
      void loadLiveScores();
    };

    const timeout = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, POLL_INTERVAL);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-500 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
            Live score widget
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Match scores in real time
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]" />
          Auto-refresh every 45s
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-40 rounded-[28px] border border-white/10 bg-white/5 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-6 text-slate-100">
          <p className="text-lg font-semibold text-white">Live score feed unavailable</p>
          <p className="mt-2 text-sm text-slate-200">
            We couldn&apos;t load the latest live score updates.
          </p>
          <button
            type="button"
            onClick={() => void loadLiveScores()}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Retry
          </button>
        </div>
      ) : !hasMatches ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          <p className="text-lg font-semibold text-white">No live score matches available</p>
          <p className="mt-2 text-sm text-slate-400">
            Check back soon for the latest match updates.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleMatches.map((match) => (
              <motion.article
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-slate-900/90"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                      {match.category}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.18)]">
                        LIVE
                      </span>
                      <span className="text-sm text-slate-400">{match.minute}</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                    <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                    {match.status}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { team: match.homeTeam, label: "Home" },
                    { team: match.awayTeam, label: "Away" },
                  ].map(({ team, label }) => {
                    const badge = teamBadgeUrl(team.badge);
                    return (
                      <div key={label} className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/5 text-sm font-semibold text-white">
                            {badge ? (
                              <Image
                                src={badge}
                                alt={`${team.name} logo`}
                                width={44}
                                height={44}
                                className="h-11 w-11 rounded-3xl object-cover"
                              />
                            ) : (
                              formatShortName(team.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {team.name}
                            </p>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                              {label}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold text-white tracking-tight">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={updatedScores[match.id]}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          {match.score}
                        </motion.span>
                      </AnimatePresence>
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Current scoreline
                    </p>
                  </div>
                  <Link
                    href={match.matchUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch Match
                  </Link>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
