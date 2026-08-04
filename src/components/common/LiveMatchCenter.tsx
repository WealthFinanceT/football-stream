"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock3, TrendingUp, Tv, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMatchDateTime } from "@/lib/date";
import { buildMatchPath } from "@/lib/utils";
import type { Match } from "@/types/streamed";

function matchBadgeUrl(badge?: string) {
  return badge
    ? `https://streamed.pk/api/images/badge/${badge}.webp`
    : undefined;
}

export function LiveMatchCenter({
  liveMatches,
  todayMatchesCount,
  sportsCount,
  hdStreamsCount,
  trendingMatches,
}: {
  liveMatches: Match[];
  todayMatchesCount: number;
  sportsCount: number;
  hdStreamsCount: number;
  trendingMatches: Match[];
}) {
  const liveMatchIds = new Set(liveMatches.map((match) => match.id));

  return (
    <section className="mt-10">
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-6"
        >
          <Card className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader className="bg-slate-950/70 pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">
                    Live Match Center
                  </p>
                  <CardTitle className="text-3xl text-white">
                    Premium live dashboard
                  </CardTitle>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 sm:mt-0"
                >
                  <Link href="/matches/live">Open live schedule</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6 pt-4">
              {liveMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 text-center text-slate-400">
                  No live matches available right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {liveMatches.slice(0, 4).map((match) => {
                    const homeName = match.teams?.home?.name ?? "Home";
                    const awayName = match.teams?.away?.name ?? "Away";
                    const homeBadge = matchBadgeUrl(match.teams?.home?.badge);
                    const awayBadge = matchBadgeUrl(match.teams?.away?.badge);
                    const isLive = Boolean(match.popular);

                    return (
                      <motion.article
                        key={match.id}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-emerald-400/30 hover:bg-white/10"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                                {match.category}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />{" "}
                                Live
                              </span>
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                              {homeName} vs {awayName}
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                              {match.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-950/70 p-3">
                              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
                                {homeBadge ? (
                                  <Image
                                    src={homeBadge}
                                    alt={homeName}
                                    width={44}
                                    height={44}
                                    className="h-11 w-11 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                                    {homeName.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-white truncate">
                                  {homeName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
                                {awayBadge ? (
                                  <Image
                                    src={awayBadge}
                                    alt={awayName}
                                    width={44}
                                    height={44}
                                    className="h-11 w-11 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                                    {awayName.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-white truncate">
                                  {awayName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <Clock3 className="h-4 w-4 text-emerald-300" />
                              <span>{formatMatchDateTime(match.date)}</span>
                            </div>
                            <p className="text-sm text-slate-400">
                              {isLive
                                ? "Live action is underway"
                                : "Starting soon"}
                            </p>
                          </div>
                          <Button
                            asChild
                            variant="secondary"
                            className="rounded-full border border-white/10 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500/20"
                          >
                            <Link href={buildMatchPath(match.title, match.id)}>Watch Now</Link>
                          </Button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="space-y-6"
        >
          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">
                    Live Statistics
                  </p>
                  <CardTitle className="text-2xl text-white">
                    Watch the pulse
                  </CardTitle>
                </div>
                <Tv className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white">
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
                    Live Matches
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {liveMatches.length}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white">
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
                    Today&apos;s Matches
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {todayMatchesCount}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white">
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
                    Sports Available
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{sportsCount}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white">
                  <div className="flex items-center gap-2 text-sm uppercase tracking-[0.32em] text-slate-400">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    <span>HD Streams</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold">
                    {hdStreamsCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">
                    Trending Matches
                  </p>
                  <CardTitle className="text-2xl text-white">
                    Fan favorites
                  </CardTitle>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendingMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center text-slate-400">
                  No trending matches available.
                </div>
              ) : (
                trendingMatches.map((match) => {
                  const isLive = liveMatchIds.has(match.id);
                  const matchHref = buildMatchPath(match.title, match.id);
                  return (
                    <Link
                      key={match.id}
                      href={matchHref}
                      className="group block rounded-[28px] border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-white truncate">
                            {match.teams?.home?.name ?? "Home"} vs{" "}
                            {match.teams?.away?.name ?? "Away"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400 truncate">
                            {match.category}
                          </p>
                        </div>
                        {isLive ? (
                          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-rose-200">
                            Live
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
