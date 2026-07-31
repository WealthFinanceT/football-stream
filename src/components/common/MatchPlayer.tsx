"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Fullscreen,
  LayoutDashboard,
  Minimize2,
  PlayCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Stream } from "@/types/streamed";

interface MatchPlayerProps {
  streams: Stream[];
  selectedStream: Stream | null;
  loading?: boolean;
  onStreamReady?: () => void;
  onStreamError?: (message: string) => void;
  onSelectStream?: (stream: Stream) => void;
  playerMode?: "standard" | "theater" | "mini";
  onToggleTheater?: () => void;
  onToggleMini?: () => void;
  className?: string;
}

export function MatchPlayer({
  streams,
  selectedStream,
  loading = false,
  onStreamReady,
  onStreamError,
  onSelectStream,
  playerMode = "standard",
  onToggleTheater,
  onToggleMini,
  className,
}: MatchPlayerProps) {
  const stream = selectedStream ?? streams[0] ?? null;
  const playerRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [interactionTimestamp, setInteractionTimestamp] = useState(0);

  useEffect(() => {
    console.log("[MatchPlayer] selected stream", stream);
    console.log("[MatchPlayer] iframe src", stream?.embedUrl ?? "" );

    if (!stream) {
      const message = "No streams available";
      setErrorState(message);
      onStreamError?.(message);
      onStreamReady?.();
      return;
    }

    if (!stream.embedUrl) {
      const message = "No streams available";
      setErrorState(message);
      onStreamError?.(message);
      onStreamReady?.();
      return;
    }

    setErrorState(null);
    onStreamReady?.();
  }, [onStreamError, onStreamReady, stream]);

  const qualityOptions = useMemo(
    () =>
      streams.map((streamOption) => ({
        key: `${streamOption.source}-${streamOption.id}`,
        stream: streamOption,
        label: `${streamOption.source} · ${streamOption.language}${streamOption.hd ? " · HD" : ""}`,
      })),
    [streams],
  );

  useEffect(() => {
    if (!controlsVisible) return;
    const timeout = window.setTimeout(() => setControlsVisible(false), 2800);
    return () => window.clearTimeout(timeout);
  }, [controlsVisible, interactionTimestamp]);

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerRef.current.requestFullscreen) {
        await playerRef.current.requestFullscreen();
      }
    } catch {
      setErrorState("Unable to enter fullscreen mode.");
    }
  };

  const switchStream = useCallback(() => {
    if (!stream || !onSelectStream || streams.length < 2) return;
    const currentIndex = streams.findIndex(
      (streamOption) =>
        streamOption.id === stream.id && streamOption.source === stream.source,
    );
    const nextStream = streams[(currentIndex + 1) % streams.length];
    onSelectStream(nextStream);
    setErrorState(null);
  }, [onSelectStream, stream, streams]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as EventTarget | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        onToggleTheater?.();
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        onToggleMini?.();
      }

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        switchStream();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onToggleMini,
    onToggleTheater,
    onSelectStream,
    stream?.id,
    stream?.source,
    streams,
    switchStream,
  ]);

  const handleInteraction = () => {
    setControlsVisible(true);
    setInteractionTimestamp(Date.now());
  };

  const handleIframeError = () => {
    const message =
      "Stream blocked or unavailable. Try another source or open the match in a new window.";
    setErrorState(message);
    onStreamError?.(message);
    onStreamReady?.();
  };

  const handleOpenExternal = () => {
    if (!stream) return;
    window.open(stream.embedUrl, "_blank");
  };

  if (!stream) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-[24px] border border-border/70 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-800 p-6",
          className,
        )}
      >
        <div className="rounded-full border border-white/15 bg-white/10 p-6 backdrop-blur">
          <PlayCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      onMouseMove={handleInteraction}
      onFocus={handleInteraction}
      className={cn(
        "relative transition-all",
        className,
        playerMode === "mini" &&
          "fixed bottom-6 right-6 z-50 w-[360px] shadow-2xl shadow-black/60",
        playerMode === "theater" &&
          "mx-auto max-w-[1320px] rounded-[32px] border-2 border-emerald-400/20 bg-slate-950/95",
        playerMode !== "mini" &&
          "rounded-[24px] border border-border/70 bg-black/80",
      )}
    >
      <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-black/80">
        {loading || errorState ? (
          <div className="aspect-video flex items-center justify-center bg-slate-950/95 p-8 text-center">
            {errorState ? (
              <div className="space-y-4 text-white">
                <AlertTriangle className="mx-auto h-12 w-12 text-rose-400" />
                <p className="text-sm text-slate-300">{errorState}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorState(null);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40 hover:bg-white/10"
                  >
                    Retry stream
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
                  >
                    Open in new window
                  </button>
                </div>
              </div>
            ) : (
              <LoadingSpinner label="Loading stream" />
            )}
          </div>
        ) : (
          <iframe
            loading="lazy"
            src={stream.embedUrl}
            title={`${stream.source} stream`}
            className="aspect-video w-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={() => {
              setErrorState(null);
              onStreamReady?.();
            }}
            onError={handleIframeError}
          />
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-b from-slate-950/80 to-transparent px-4 py-4 transition-opacity duration-300 sm:px-6",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              TV Mode Control
            </p>
            <p className="text-sm font-semibold text-white">
              Premium viewing experience
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <Fullscreen className="h-4 w-4" />
              Fullscreen
            </button>
            <button
              type="button"
              onClick={onToggleTheater}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <LayoutDashboard className="h-4 w-4" />
              Theater
            </button>
            <button
              type="button"
              onClick={onToggleMini}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <Minimize2 className="h-4 w-4" />
              Mini TV
            </button>
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-4 pt-4 transition-opacity duration-300 sm:px-6",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur-sm sm:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Watching
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {stream.source} · {stream.language}
                {stream.hd ? " · HD" : ""}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={switchStream}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Switch stream
              </button>
              <button
                type="button"
                onClick={handleOpenExternal}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Open external
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {qualityOptions.slice(0, 3).map((option) => {
              const active =
                option.stream.id === stream.id &&
                option.stream.source === stream.source;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onSelectStream?.(option.stream);
                    setErrorState(null);
                  }}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-left text-sm transition",
                    active
                      ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/30 hover:bg-white/10",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-500">
            Shortcuts: F to fullscreen · T for theater · M for mini TV · S to
            switch source
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Now playing</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stream.language} · {stream.source}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
            {playerMode === "mini"
              ? "Mini TV"
              : playerMode === "theater"
                ? "Theater"
                : "Standard"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {stream.hd ? "HD stream" : "Standard stream"}
        </p>
      </div>
    </div>
  );
}
