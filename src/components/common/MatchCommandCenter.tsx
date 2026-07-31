"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Heart, PlayCircle, Share2, TrendingUp, Tv } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchPlayer } from "@/components/common/MatchPlayer";
import { addToWatchHistory, getFavorites, toggleFavorite } from "@/lib/persistence";
import type { Match, Stream } from "@/types/streamed";

function formatDate(date: number) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(date: number) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchCommandCenter({
  match,
  streams,
  relatedLiveMatches,
  popularMatches,
}: {
  match: Match;
  streams: Stream[];
  relatedLiveMatches: Match[];
  popularMatches: Match[];
}) {
  const matchKey = `match-selected-stream-${match.id}`;
  const firstSource = match.sources?.[0];
  const [resolvedStreams, setResolvedStreams] = useState<Stream[]>(streams);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(() => {
    if (typeof window === "undefined") return streams[0] ?? null;
    const savedKey = window.localStorage.getItem(matchKey);
    if (!savedKey) return streams[0] ?? null;
    return streams.find((stream) => `${stream.source}-${stream.id}` === savedKey) ?? streams[0] ?? null;
  });
  const [isLoadingStream, setIsLoadingStream] = useState(() => streams.length === 0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [favoriteAdded, setFavoriteAdded] = useState(() => getFavorites().some((item) => item.id === match.id));
  const [playerMode, setPlayerMode] = useState<"standard" | "theater" | "mini">("standard");
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    addToWatchHistory({ id: match.id, title: match.title, category: match.category });
  }, [match.category, match.id, match.title]);

  useEffect(() => {
    if (!selectedStream) return;
    window.localStorage.setItem(matchKey, `${selectedStream.source}-${selectedStream.id}`);
  }, [matchKey, selectedStream]);

  useEffect(() => {
    let active = true;

    if (!firstSource) {
      setResolvedStreams([]);
      setSelectedStream(null);
      setIsLoadingStream(false);
      setStreamError("No streams available");
      return () => {
        active = false;
      };
    }

    const loadStreams = async () => {
      console.log("[MatchCommandCenter] requested source", firstSource.source);
      console.log("[MatchCommandCenter] requested id", firstSource.id);

      try {
        const response = await fetch(
          `/api/streams/${encodeURIComponent(firstSource.source)}/${encodeURIComponent(firstSource.id)}`,
        );
        const payload = await response.json();
        console.log("[MatchCommandCenter] API response", payload);

        if (!active) return;

        if (!Array.isArray(payload) || payload.length === 0) {
          setResolvedStreams([]);
          setSelectedStream(null);
          setIsLoadingStream(false);
          setStreamError("No streams available");
          return;
        }

        const normalizedStreams = payload
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map((item) => ({
            id: String(item.id ?? ""),
            streamNo: Number(item.streamNo ?? 0),
            language: String(item.language ?? "Unknown"),
            hd: Boolean(item.hd),
            embedUrl: String(item.embedUrl ?? ""),
            source: String(item.source ?? firstSource.source),
          }))
          .filter((item) => Boolean(item.embedUrl));

        setResolvedStreams(normalizedStreams);

        if (normalizedStreams.length === 0) {
          setSelectedStream(null);
          setIsLoadingStream(false);
          setStreamError("No streams available");
          return;
        }

        const savedKey = window.localStorage.getItem(matchKey);
        const matchingStream = normalizedStreams.find(
          (stream) => `${stream.source}-${stream.id}` === savedKey,
        );

        setSelectedStream(matchingStream ?? normalizedStreams[0]);
        setIsLoadingStream(false);
        setStreamError(null);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Unable to load stream";
        console.error("[MatchCommandCenter] stream fetch failed", error);
        setResolvedStreams([]);
        setSelectedStream(null);
        setIsLoadingStream(false);
        setStreamError(message);
      }
    };

    loadStreams();

    return () => {
      active = false;
    };
  }, [firstSource?.id, firstSource?.source, match.id, matchKey]);

  const isLive = Boolean(match.popular);
  const homeName = match.teams?.home?.name ?? "Home";
  const awayName = match.teams?.away?.name ?? "Away";
  const streamCount = resolvedStreams.length;

  const handleFavorite = () => {
    const updated = toggleFavorite({ id: match.id, title: match.title, category: match.category });
    const isFavorite = updated.some((item) => item.id === match.id);
    setFavoriteAdded(isFavorite);
    setActionMessage(isFavorite ? "Added to favorites" : "Removed from favorites");
    window.setTimeout(() => setActionMessage(null), 2400);
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    await window.navigator.clipboard.writeText(window.location.href);
    setActionMessage("Link copied to clipboard");
    window.setTimeout(() => setActionMessage(null), 2400);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: match.title,
          text: `Watch ${homeName} vs ${awayName}`,
          url: window.location.href,
        });
        setActionMessage("Shared successfully");
      } catch {
        setActionMessage("Sharing canceled");
      }
    } else {
      await handleCopyLink();
    }
    window.setTimeout(() => setActionMessage(null), 2400);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="space-y-6"
      >
        <Card className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
          <CardHeader className="bg-slate-950/70 p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Match Command Center</p>
                <CardTitle className="text-3xl text-white">{homeName} vs {awayName}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
                  <PlayCircle className="h-4 w-4" />
                  {isLive ? "Live now" : "Upcoming"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  {formatDate(match.date)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            <MatchPlayer
              streams={resolvedStreams}
              selectedStream={selectedStream}
              loading={isLoadingStream}
              onStreamReady={() => {
                setIsLoadingStream(false);
                setStreamError(null);
              }}
              onStreamError={(message) => setStreamError(message)}
              onSelectStream={(stream) => {
                setIsLoadingStream(true);
                setSelectedStream(stream);
                setStreamError(null);
              }}
              playerMode={playerMode}
              onToggleTheater={() => setPlayerMode((current) => (current === "theater" ? "standard" : "theater"))}
              onToggleMini={() => setPlayerMode((current) => (current === "mini" ? "standard" : "mini"))}
            />

            {streamError ? (
              <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100">
                <p className="font-semibold">Stream issue detected</p>
                <p className="mt-2 text-slate-100">{streamError}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStreamError(null)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    Retry stream
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStream(resolvedStreams[0] ?? null)}
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
                  >
                    Reset source
                  </button>
                </div>
              </div>
            ) : null}

            <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
              <CardContent className="space-y-4 p-6">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Competition</p>
                  <p className="mt-3 text-lg font-semibold text-white">{match.category}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Kickoff</p>
                  <p className="mt-3 text-lg font-semibold text-white">{formatDate(match.date)}</p>
                  <p className="mt-2 text-sm text-slate-400">{formatTime(match.date)}</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Match ID</p>
                    <p className="mt-3 break-all text-lg font-semibold text-white">{match.id}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Available streams</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{streamCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut", delay: 0.05 }}
        className="space-y-6"
      >
        <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Next Live Matches</p>
                <CardTitle className="text-2xl text-white">Up next on the schedule</CardTitle>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">TV Mode lineup</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedLiveMatches.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-slate-400">No next live matches are available.</div>
            ) : (
              relatedLiveMatches.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/matches/${item.id}`}
                  className="group rounded-[28px] border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white truncate">{item.teams?.home?.name ?? "Home"} vs {item.teams?.away?.name ?? "Away"}</p>
                      <p className="mt-2 text-xs text-slate-400">{item.category}</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">Live</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">Kickoff {formatTime(item.date)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.05 }}
          className="space-y-6"
        >
          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Available Streams</p>
                  <CardTitle className="text-2xl text-white">Premium stream feeds</CardTitle>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">{streamCount} sources</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {resolvedStreams.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                  No streams are currently available for this match.
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedStreams.map((stream) => {
                    const active = selectedStream?.id === stream.id && selectedStream?.source === stream.source;
                    return (
                      <button
                        key={`${stream.source}-${stream.id}`}
                        type="button"
                        onClick={() => setSelectedStream(stream)}
                        className={`group w-full rounded-[28px] border p-5 text-left transition duration-300 ${
                          active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-emerald-400/30 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-white">{stream.source}</p>
                            <p className="mt-1 text-sm text-slate-400">{stream.language}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                            {stream.hd ? (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">HD</span>
                            ) : null}
                            {active ? (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">Active</span>
                            ) : (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">Switch</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Match Information</p>
                <CardTitle className="text-2xl text-white">Command details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Competition</p>
                  <p className="mt-2 text-sm font-semibold text-white">{match.category}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Kickoff</p>
                  <p className="mt-2 text-sm font-semibold text-white">{formatDate(match.date)}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Match ID</p>
                  <p className="mt-2 text-sm font-semibold text-white break-all">{match.id}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Streams</p>
                  <p className="mt-2 text-sm font-semibold text-white">{streamCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
          className="space-y-6 lg:sticky lg:top-24"
        >
          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Related Live Matches</p>
                  <CardTitle className="text-2xl text-white">Now streaming</CardTitle>
                </div>
                <Tv className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedLiveMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center text-slate-400">No related live matches right now.</div>
              ) : (
                relatedLiveMatches.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/matches/${item.id}`}
                    className="group block rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.teams?.home?.name ?? "Home"} vs {item.teams?.away?.name ?? "Away"}</p>
                        <p className="mt-1 text-xs text-slate-400 truncate">{item.category}</p>
                      </div>
                      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200">Live</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Popular Today</p>
                  <CardTitle className="text-2xl text-white">Trending now</CardTitle>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {popularMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center text-slate-400">No popular matches in view.</div>
              ) : (
                popularMatches.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/matches/${item.id}`}
                    className="group block rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.teams?.home?.name ?? "Home"} vs {item.teams?.away?.name ?? "Away"}</p>
                        <p className="mt-1 text-xs text-slate-400 truncate">{item.category}</p>
                      </div>
                      {item.popular ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">Popular</span>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Quick Actions</p>
                  <CardTitle className="text-2xl text-white">Match controls</CardTitle>
                </div>
                <Share2 className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleFavorite}
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-emerald-300" />
                    <span>Add to Favorites</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="h-4 w-4 text-emerald-300" />
                    <span>Share Match</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="h-4 w-4 text-emerald-300" />
                    <span>Copy Link</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode((current) => (current === "theater" ? "standard" : "theater"))}
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Tv className="h-4 w-4 text-emerald-300" />
                    <span>{playerMode === "theater" ? "Exit Theater" : "Theater Mode"}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode((current) => (current === "mini" ? "standard" : "mini"))}
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className="h-4 w-4 text-emerald-300" />
                    <span>{playerMode === "mini" ? "Close Mini TV" : "Open Mini TV"}</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-4 w-4 text-emerald-300" />
                    <span>Back Home</span>
                  </div>
                </button>
              </div>
              {actionMessage ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{actionMessage}</p> : null}
              {favoriteAdded ? <p className="text-sm text-slate-300">Added to favorites for this browser.</p> : null}
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </div>
  );
}
