"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { formatMatchTime } from "@/lib/date";
import { buildMatchPath } from "@/lib/utils";
import type { Match } from "@/types/streamed";

function matchBadgeUrl(badge?: string) {
  return badge
    ? `https://streamed.pk/api/images/badge/${badge}.webp`
    : undefined;
}

export function LiveNowCard({ match }: { match: Match }) {
  const matchHref = buildMatchPath(match.title, match.id);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-w-[320px] max-w-[320px] rounded-[32px] border border-white/10 bg-slate-950/80 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <Link href={matchHref} className="block h-full">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">
              Live Now
            </p>
            <p className="text-lg font-semibold text-white">{match.category}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-300 backdrop-blur">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/30 animate-pulse" />
            Live
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-sm font-semibold text-white">
                {match.teams?.home?.badge ? (
                  <Image
                    src={matchBadgeUrl(match.teams.home.badge) ?? ""}
                    alt={match.teams.home.name ?? "Home"}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {match.teams?.home?.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-300">Home</p>
              <p className="mt-1 text-base font-semibold text-white">
                {match.teams?.home?.name ?? "Home"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-sm font-semibold text-white">
                {match.teams?.away?.badge ? (
                  <Image
                    src={matchBadgeUrl(match.teams.away.badge) ?? ""}
                    alt={match.teams.away.name ?? "Away"}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {match.teams?.away?.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-300">Away</p>
              <p className="mt-1 text-base font-semibold text-white">
                {match.teams?.away?.name ?? "Away"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Kickoff
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Clock3 className="h-4 w-4 text-emerald-300" />
              {formatMatchTime(match.date)}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Premium coverage</p>
          <p className="mt-1 text-slate-300">
            Live commentary, stream selection, and match insights.
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
