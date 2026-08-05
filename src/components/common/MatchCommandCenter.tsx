"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Heart, PlayCircle, Share2, TrendingUp, Tv } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchPlayer } from "@/components/common/MatchPlayer";
import { formatMatchDateTime, formatMatchTime } from "@/lib/date";
import { addToWatchHistory, getFavorites, toggleFavorite } from "@/lib/persistence";
import { buildMatchPath } from "@/lib/utils";
import type { Match, Stream } from "@/types/streamed";

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
  const isLive = Boolean(match.popular);
  const [resolvedStreams, setResolvedStreams] = useState<Stream[]>(streams);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(() => {
    if (typeof window === "undefined") return streams[0] ?? null;
    const savedKey = window.localStorage.getItem(matchKey);
    if (!savedKey) return streams[0] ?? null;
    return streams.find((stream) => `${stream.source}-${stream.id}` === savedKey) ?? streams[0] ?? null;
  });
  const [isLoadingStream, setIsLoadingStream] = useState(() => streams.length === 0);
  const [isRefreshingStream, setIsRefreshingStream] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [favoriteAdded, setFavoriteAdded] = useState(() => getFavorites().some((item) => item.id === match.id));
  const [playerMode, setPlayerMode] = useState<"standard" | "theater" | "mini">("standard");
  const [streamError, setStreamError] = useState<string | null>(null);
  const selectedStreamRef = useRef<Stream | null>(selectedStream);
  const refreshTimerRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const failedStreamKeysRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const getStreamKey = (stream: Stream) => `${stream.source}:${stream.id}:${stream.streamNo}`;

  const markStreamFailed = (stream: Stream | null) => {
    if (!stream) return;
    failedStreamKeysRef.current.add(getStreamKey(stream));
  };

  const selectNextStream = (streamsList: Stream[], currentStream: Stream | null) => {
    return (
      streamsList.find((stream) => {
        const key = getStreamKey(stream);
        return (!currentStream || key !== getStreamKey(currentStream)) && !failedStreamKeysRef.current.has(key);
      }) ?? streamsList[0] ?? null
    );
  };

  useEffect(() => {
    selectedStreamRef.current = selectedStream;
  }, [selectedStream]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    addToWatchHistory({ id: match.id, title: match.title, category: match.category });
  }, [match.category, match.id, match.title]);

  useEffect(() => {
    if (!selectedStream) return;
    window.localStorage.setItem(matchKey, `${selectedStream.source}-${selectedStream.id}`);
  }, [matchKey, selectedStream]);

  const requestStreams = useCallback(
    async function requestStreamsInternal(attempt = 0) {
      if (!mountedRef.current) return;
      if (!match.sources || match.sources.length === 0) {
        setResolvedStreams([]);
        setSelectedStream(null);
        setIsLoadingStream(false);
        setIsRefreshingStream(false);
        setStreamError("No streams available");
        return;
      }

      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (attempt === 0) {
        failedStreamKeysRef.current = new Set();
      }

      setIsLoadingStream(true);
      setIsRefreshingStream(attempt > 0);
      setStreamError(attempt > 0 ? "Reconnecting to stream..." : null);

      try {
        const candidates = [
          firstSource ? { source: firstSource.source, id: firstSource.id } : null,
          ...match.sources.map((source) => ({ source: source.source, id: source.id })),
          firstSource
            ? [
                { source: firstSource.source, id: match.id },
                { source: firstSource.source, id: match.id.replace(/^ppv-/, "") },
                { source: "admin", id: firstSource.id },
                { source: "ppv", id: firstSource.id },
                { source: "admin", id: match.id },
                { source: "ppv", id: match.id },
              ]
            : [],
        ].flat() as Array<{ source: string; id: string }>;

        const seenCandidates = new Set<string>();
        const uniqueCandidates = candidates.filter((candidate) => {
          const key = `${candidate.source}:${candidate.id}`;
          if (!candidate.source || !candidate.id || seenCandidates.has(key)) return false;
          seenCandidates.add(key);
          return true;
        });

        let normalizedStreams: Stream[] = [];

        for (const candidate of uniqueCandidates) {
          if (!mountedRef.current) return;

          const requestUrl = `/api/streams/${encodeURIComponent(candidate.source)}/${encodeURIComponent(candidate.id)}`;
          if (process.env.NODE_ENV === "development") {
            console.debug("[MatchCommandCenter] fetch candidate stream", { requestUrl, attempt, candidate });
          }

          try {
            const response = await fetch(requestUrl, { cache: "no-store" });
            const responseText = await response.text();
            const bodyPreview = responseText.length > 1000 ? `${responseText.slice(0, 1000)}...` : responseText;

            if (!response.ok) {
              if (process.env.NODE_ENV === "development") {
                console.debug("[MatchCommandCenter] candidate stream response error", {
                  requestUrl,
                  status: response.status,
                  body: bodyPreview,
                });
              }
              continue;
            }

            let payload: unknown;
            try {
              payload = JSON.parse(responseText);
            } catch (parseError) {
              if (process.env.NODE_ENV === "development") {
                console.debug("[MatchCommandCenter] invalid stream JSON", {
                  requestUrl,
                  body: bodyPreview,
                  parseError,
                });
              }
              continue;
            }

            if (!Array.isArray(payload) || payload.length === 0) {
              continue;
            }

            const candidateStreams = payload
              .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
              .map((item) => {
                const embedUrl = String(item.embedUrl ?? "").trim();
                return {
                  id: String(item.id ?? ""),
                  streamNo: Number(item.streamNo ?? 0),
                  language: String(item.language ?? "Unknown"),
                  hd: Boolean(item.hd),
                  embedUrl,
                  source: String(item.source ?? candidate.source),
                };
              })
              .filter((item) => {
                if (!item.embedUrl) return false;
                return item.embedUrl.startsWith("http://") || item.embedUrl.startsWith("https://");
              });

            if (candidateStreams.length === 0) {
              continue;
            }

            normalizedStreams = candidateStreams.filter(
              (stream) => !failedStreamKeysRef.current.has(getStreamKey(stream)),
            );

            if (normalizedStreams.length > 0) {
              break;
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.debug("[MatchCommandCenter] stream candidate fetch failed", { requestUrl, error });
            }
            continue;
          }
        }

        setResolvedStreams(normalizedStreams);

        if (normalizedStreams.length === 0) {
          if (isLive) {
            retryTimeoutRef.current = window.setTimeout(() => {
              void requestStreamsInternal(0);
            }, 20000);
            setResolvedStreams([]);
            setIsLoadingStream(false);
            setIsRefreshingStream(false);
            setStreamError("No streams available — retrying...");
            return;
          }

          if (attempt < 3) {
            const delayMs = 10000 * 2 ** attempt;
            retryTimeoutRef.current = window.setTimeout(() => {
              void requestStreamsInternal(attempt + 1);
            }, delayMs);
            return;
          }

          setSelectedStream(null);
          setIsLoadingStream(false);
          setIsRefreshingStream(false);
          setStreamError("Match unavailable");
          return;
        }

        const savedKey = window.localStorage.getItem(matchKey);
        const currentSelection = selectedStreamRef.current;
        const matchingStream =
          normalizedStreams.find(
            (stream) =>
              currentSelection &&
              stream.source === currentSelection.source &&
              stream.id === currentSelection.id &&
              !failedStreamKeysRef.current.has(getStreamKey(stream)),
          ) ??
          normalizedStreams.find(
            (stream) =>
              `${stream.source}-${stream.id}` === savedKey &&
              !failedStreamKeysRef.current.has(getStreamKey(stream)),
          ) ??
          normalizedStreams.find((stream) => !failedStreamKeysRef.current.has(getStreamKey(stream))) ??
          normalizedStreams[0];

        setSelectedStream(matchingStream);
        setIsLoadingStream(false);
        setIsRefreshingStream(false);
        setStreamError(null);

        if (refreshTimerRef.current === null) {
          refreshTimerRef.current = window.setInterval(() => {
            if (!mountedRef.current) return;
            void requestStreamsInternal(0);
          }, isLive ? 20000 : 30000);
        }
      } catch (error) {
        if (!mountedRef.current) return;
        console.error("[MatchCommandCenter] stream fetch failed", error);

        if (attempt < 3) {
          const delayMs = 10000 * 2 ** attempt;
          setStreamError("Reconnecting to stream...");
          retryTimeoutRef.current = window.setTimeout(() => {
            void requestStreamsInternal(attempt + 1);
          }, delayMs);
          return;
        }

        setResolvedStreams([]);
        setSelectedStream(null);
        setIsLoadingStream(false);
        setIsRefreshingStream(false);
        setStreamError("Match unavailable");
      }
    },
    [firstSource, match.id, match.sources, matchKey, isLive],
  );

  useEffect(() => {
    void requestStreams(0);

    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [requestStreams]);

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
    <div className="mx-auto w-full max-w-screen-xl overflow-x-hidden space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="space-y-6"
      >
        <Card className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 sm:rounded-[32px]">
          <CardHeader className="bg-slate-950/70 p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Match Command Center</p>
                <CardTitle className="max-w-full break-words text-2xl text-white sm:text-3xl">{homeName} vs {awayName}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
                  <PlayCircle className="h-4 w-4" />
                  {isLive ? "Live now" : "Upcoming"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  {formatMatchDateTime(match.date)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-4 md:p-6">
            <MatchPlayer
              streams={resolvedStreams}
              selectedStream={selectedStream}
              loading={isLoadingStream || isRefreshingStream}
              onStreamReady={() => {
                setIsLoadingStream(false);
                setIsRefreshingStream(false);
                setStreamError(null);
              }}
              onStreamError={(message) => {
                setStreamError(message);
                markStreamFailed(selectedStreamRef.current);
                const nextStream = selectNextStream(resolvedStreams, selectedStreamRef.current);
                if (nextStream && nextStream !== selectedStreamRef.current) {
                  setSelectedStream(nextStream);
                  setStreamError("Switching to next available stream...");
                }
                if (!isRefreshingStream) {
                  void requestStreams(0);
                }
              }}
              onSelectStream={(stream) => {
                if (retryTimeoutRef.current !== null) {
                  window.clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = null;
                }
                setIsLoadingStream(false);
                setIsRefreshingStream(false);
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

            <Card className="rounded-[24px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 sm:rounded-[32px]">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 md:p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Competition</p>
                  <p className="mt-3 break-words text-lg font-semibold text-white">{match.category}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 md:p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Kickoff</p>
                  <p className="mt-3 break-words text-lg font-semibold text-white">{formatMatchDateTime(match.date)}</p>
                  <p className="mt-2 text-sm text-slate-400">{formatMatchTime(match.date)}</p>
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
        <Card className="rounded-[24px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 sm:rounded-[32px]">
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Next Live Matches</p>
                <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Up next on the schedule</CardTitle>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">TV Mode lineup</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 xl:grid-cols-4">
            {relatedLiveMatches.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-slate-400">No next live matches are available.</div>
            ) : (
              relatedLiveMatches.slice(0, 4).map((item) => {
                const itemHref = buildMatchPath(item.title, item.id);
                return (
                  <Link
                    key={item.id}
                    href={itemHref}
                    className="group rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10 sm:rounded-[28px] sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{item.teams?.home?.name ?? "Home"} vs {item.teams?.away?.name ?? "Away"}</p>
                        <p className="mt-2 text-xs text-slate-400">{item.category}</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">Live</span>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">Kickoff {formatMatchTime(item.date)}</p>
                  </Link>
                );
              })
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
                  <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Premium stream feeds</CardTitle>
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
                        className={`group w-full rounded-[24px] border p-4 text-left transition duration-300 sm:rounded-[28px] sm:p-5 ${
                          active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-emerald-400/30 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words text-base font-semibold text-white">{stream.source}</p>
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
                <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Command details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Competition</p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">{match.category}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Kickoff</p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">{formatMatchDateTime(match.date)}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Match ID</p>
                  <p className="mt-2 break-all text-sm font-semibold text-white">{match.id}</p>
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
                  <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Now streaming</CardTitle>
                </div>
                <Tv className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedLiveMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center text-slate-400">No related live matches right now.</div>
              ) : (
                relatedLiveMatches.slice(0, 5).map((item) => {
                  const itemHref = buildMatchPath(item.title, item.id);
                  return (
                    <Link
                      key={item.id}
                      href={itemHref}
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
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Popular Today</p>
                  <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Trending now</CardTitle>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {popularMatches.length === 0 ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-center text-slate-400">No popular matches in view.</div>
              ) : (
                popularMatches.slice(0, 5).map((item) => {
                  const itemHref = buildMatchPath(item.title, item.id);
                  return (
                    <Link
                      key={item.id}
                      href={itemHref}
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
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Quick Actions</p>
                  <CardTitle className="max-w-full break-words text-xl text-white sm:text-2xl">Match controls</CardTitle>
                </div>
                <Share2 className="h-6 w-6 text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleFavorite}
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-emerald-300" />
                    <span>Add to Favorites</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="h-4 w-4 text-emerald-300" />
                    <span>Share Match</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="h-4 w-4 text-emerald-300" />
                    <span>Copy Link</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode((current) => (current === "theater" ? "standard" : "theater"))}
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Tv className="h-4 w-4 text-emerald-300" />
                    <span>{playerMode === "theater" ? "Exit Theater" : "Theater Mode"}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode((current) => (current === "mini" ? "standard" : "mini"))}
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className="h-4 w-4 text-emerald-300" />
                    <span>{playerMode === "mini" ? "Close Mini TV" : "Open Mini TV"}</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="w-full justify-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
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
