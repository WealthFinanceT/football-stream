"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, Trophy } from "lucide-react";
import type { Match } from "@/types/streamed";
import { buildMatchPath } from "@/lib/utils";

function matchBadgeUrl(badge?: string) {
  return badge ? `https://streamed.pk/api/images/badge/${badge}.webp` : undefined;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function extractScore(title?: string) {
  if (!title) return undefined;
  const match = title.match(/(\d+)\s*[-:\u2013]\s*(\d+)/);
  return match ? `${match[1]} - ${match[2]}` : undefined;
}

const STADIUM_IMAGE =
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80";

export function FeaturedMatchSpotlight({ match }: { match: Match }) {
  const startTime = 1767225600000;
  const [countdown, setCountdown] = useState(() => formatCountdown(Math.max(match.date - startTime, 0)));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(Math.max(match.date - startTime, 0)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [match.date]);

  const isStarted = match.popular;
  const score = extractScore(match.title);
  const matchHref = buildMatchPath(match.title, match.id);

  const backgroundImage = match.poster ? match.poster : STADIUM_IMAGE;

  const homeName = match.teams?.home?.name ?? "Home";
  const awayName = match.teams?.away?.name ?? "Away";
  const homeBadge = match.teams?.home?.badge ? matchBadgeUrl(match.teams.home.badge) : undefined;
  const awayBadge = match.teams?.away?.badge ? matchBadgeUrl(match.teams.away.badge) : undefined;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30"
      style={{
        backgroundImage: `linear-gradient(rgba(8, 12, 20, 0.76), rgba(8, 12, 20, 0.4)), url(${backgroundImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
      <div className="relative grid gap-8 px-6 py-10 md:grid-cols-[1.4fr_0.9fr] md:items-end md:px-10 lg:px-14 lg:py-14">
        <div className="space-y-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-emerald-300 backdrop-blur">
            <Trophy className="h-4 w-4 text-emerald-300" />
            Featured match spotlight
          </div>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-300">{match.category}</p>
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {match.title}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              The biggest live fixture from the Streamed API, hand-selected automatically for premium viewing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Match status</p>
              <p className="mt-2 text-lg font-semibold text-white">{isStarted ? "Live now" : "Starting soon"}</p>
              <p className="mt-1 text-sm text-slate-300">
                {isStarted ? "Catch every goal and stream instantly." : `Kickoff in ${countdown}`}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Scoreboard</p>
              <p className="mt-2 text-3xl font-semibold text-white">{score ?? (isStarted ? "Live action" : "TBD")}</p>
              <p className="mt-1 text-sm text-slate-300">{score ? "Current match score" : "Score updates available once live."}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={matchHref}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Watch Live
            </Link>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {match.category} • {homeName} vs {awayName}
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur md:place-self-center">
          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em]">Home team</p>
                <p className="mt-2 text-lg font-semibold text-white">{homeName}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-sm text-white">
                {homeBadge ? <Image src={homeBadge} alt={homeName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" /> : homeName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            <div className="flex items-center justify-between gap-4 text-slate-300">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em]">Away team</p>
                <p className="mt-2 text-lg font-semibold text-white">{awayName}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-sm text-white">
                {awayBadge ? <Image src={awayBadge} alt={awayName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" /> : awayName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 text-slate-300">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
              <span>Live coverage</span>
              <span>{match.sources.length} feeds</span>
            </div>
            <p className="mt-3 text-sm text-slate-200">Streamed sources are available for the selected match. Tap Watch Live to open the full player page.</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
