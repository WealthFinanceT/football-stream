"use client";

import Hls, { type ErrorData } from "hls.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Fullscreen,
  LayoutDashboard,
  MessageCircle,
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

function isHlsStreamUrl(url: string) {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  return normalized.includes(".m3u8") || normalized.includes("/hls/");
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [interactionTimestamp, setInteractionTimestamp] = useState(0);
  const [renderMode, setRenderMode] = useState<"loading" | "iframe" | "hls" | "fallback">("loading");
  const [isStreamOptionsOpen, setIsStreamOptionsOpen] = useState(false);

  useEffect(() => {
    const applyStreamState = () => {
      if (!stream) {
        const message = "No streams available";
        setRenderMode("fallback");
        setErrorState(message);
        onStreamError?.(message);
        onStreamReady?.();
        return;
      }

      if (!stream.embedUrl) {
        const message = "No streams available";
        setRenderMode("fallback");
        setErrorState(message);
        onStreamError?.(message);
        onStreamReady?.();
        return;
      }

      const shouldUseHls = isHlsStreamUrl(stream.embedUrl);
      if (shouldUseHls) {
        setRenderMode("loading");
        setErrorState(null);
        onStreamReady?.();
        return;
      }

      setRenderMode("iframe");
      setErrorState(null);
      onStreamReady?.();
    };

    const timeout = window.setTimeout(applyStreamState, 0);
    return () => window.clearTimeout(timeout);
  }, [onStreamError, onStreamReady, stream]);

  useEffect(() => {
    if (!stream?.embedUrl) return;

    const shouldUseHls = isHlsStreamUrl(stream.embedUrl);
    if (!shouldUseHls) {
      const timeout = window.setTimeout(() => {
        setRenderMode("iframe");
        setErrorState(null);
        onStreamReady?.();
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    if (!Hls.isSupported()) {
      const message = "HLS playback is not supported in this browser.";
      const timeout = window.setTimeout(() => {
        setRenderMode("fallback");
        setErrorState(message);
        onStreamError?.(message);
        onStreamReady?.();
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
    });

    hlsRef.current?.destroy();
    hlsRef.current = hls;

    const handleHlsError = (_event: string, data: ErrorData) => {
      const isManifestError =
        data?.fatal ||
        data?.details?.toLowerCase().includes("manifest") ||
        data?.details?.toLowerCase().includes("playlist");

      if (!isManifestError) return;

      const message =
        "HLS playback failed due to a manifest or network issue. Switching to the provider fallback.";
      console.warn("[MatchPlayer] HLS playback error", data);
      setRenderMode("fallback");
      setErrorState(message);
      onStreamError?.(message);
      onStreamReady?.();
      hls.destroy();
      hlsRef.current = null;
    };

    hls.on(Hls.Events.ERROR, handleHlsError);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setRenderMode("hls");
      setErrorState(null);
      onStreamReady?.();
    });

    hls.loadSource(stream.embedUrl);
    hls.attachMedia(videoElement);

    return () => {
      hls.off(Hls.Events.ERROR, handleHlsError);
      hls.destroy();
      hlsRef.current = null;
    };
  }, [onStreamError, onStreamReady, stream?.embedUrl]);

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

  const handleRetry = () => {
    setErrorState(null);
    setRenderMode("loading");
  };

  if (!stream) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-[24px] border border-border/70 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-800 p-4 sm:p-6",
          className,
        )}
      >
        <div className="rounded-full border border-white/15 bg-white/10 p-6 backdrop-blur">
          <PlayCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  const showPlayerBody = renderMode === "hls" || renderMode === "iframe";

  return (
    <div
      ref={playerRef}
      onMouseMove={handleInteraction}
      onFocus={handleInteraction}
      className={cn(
        "relative w-full max-w-full overflow-hidden transition-all",
        className,
        playerMode === "mini" &&
          "fixed bottom-4 right-3 z-50 w-[calc(100vw-1.5rem)] shadow-2xl shadow-black/60 sm:right-6 sm:w-[360px]",
        playerMode === "theater" &&
          "mx-auto w-full max-w-[1320px] rounded-[24px] border-2 border-emerald-400/20 bg-slate-950/95 sm:rounded-[32px]",
        playerMode !== "mini" &&
          "rounded-[24px] border border-border/70 bg-black/80",
      )}
    >
      <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-black/80">
        {loading || (!showPlayerBody && renderMode !== "fallback") ? (
          <div className="aspect-video flex items-center justify-center bg-slate-950/95 p-8 text-center">
            <LoadingSpinner label="Loading stream" />
          </div>
        ) : null}

        {!loading && renderMode === "hls" ? (
          <video
            ref={videoRef}
            controls
            playsInline
            className="aspect-video w-full bg-black"
            onCanPlay={() => {
              setRenderMode("hls");
              setErrorState(null);
            }}
          />
        ) : null}

        {!loading && renderMode === "iframe" ? (
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
        ) : null}

        {!loading && renderMode === "fallback" ? (
          <div className="aspect-video flex items-center justify-center bg-slate-950/95 p-8 text-center">
            <div className="space-y-4 text-white">
              <AlertTriangle className="mx-auto h-12 w-12 text-rose-400" />
              <p className="text-sm text-slate-300">{errorState ?? "The stream could not be loaded."}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
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
          </div>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 border-b border-white/10 bg-gradient-to-b from-slate-950/80 to-transparent px-4 py-3 transition-opacity duration-300 sm:flex-row sm:items-center sm:justify-between sm:px-6",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="hidden space-y-1 sm:block">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              TV Mode Control
            </p>
            <p className="text-sm font-semibold text-white">
              Premium viewing experience
            </p>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <Fullscreen className="h-4 w-4" />
              Fullscreen
            </button>
            <button
              type="button"
              onClick={() => setIsStreamOptionsOpen((value) => !value)}
              className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 md:hidden"
            >
              {isStreamOptionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Stream options
            </button>
            <button
              type="button"
              onClick={onToggleTheater}
              className="pointer-events-auto hidden items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" />
              Theater
            </button>
            <button
              type="button"
              onClick={onToggleMini}
              className="pointer-events-auto hidden items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 sm:inline-flex"
            >
              <Minimize2 className="h-4 w-4" />
              Mini TV
            </button>
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-4 pt-4 transition-opacity duration-300 sm:px-6 md:block",
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
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Switch stream
              </button>
              <button
                type="button"
                onClick={handleOpenExternal}
                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Open external
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
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
                    "w-full rounded-2xl border px-3 py-2 text-left text-sm transition",
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
          <p className="mt-3 hidden text-xs uppercase tracking-[0.28em] text-slate-500 md:block">
            Shortcuts: F to fullscreen · T for theater · M for mini TV · S to
            switch source
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button
            type="button"
            onClick={handleOpenExternal}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
          >
            Open external
            <ExternalLink className="h-4 w-4" />
          </button>
          <p className="text-sm text-muted-foreground">
            Keep the stream visible and use the compact controls when needed.
          </p>
        </div>

        {isStreamOptionsOpen ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 md:hidden">
            <div className="grid gap-2">
              <button
                type="button"
                onClick={switchStream}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Switch stream
              </button>
              <button
                type="button"
                onClick={handleOpenExternal}
                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Open external
              </button>
              <button
                type="button"
                onClick={onToggleMini}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Mini TV
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                Keyboard shortcuts
              </p>
              <p className="mt-2 text-sm text-slate-300">
                F to fullscreen · T for theater · M for mini TV · S to switch source
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-white/10 p-2">
              <MessageCircle className="h-5 w-5 text-emerald-100" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Need Help?</p>
              <p className="text-sm leading-6 text-emerald-50/90">
                If a stream isn&apos;t working or you find a broken link, contact support and we&apos;ll help you as soon as possible.
              </p>
            </div>
          </div>
          <a
            href="https://t.me/goalpulsesupport"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-slate-900"
          >
            Contact support on Telegram
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Now playing</p>
            <p className="mt-1 break-words text-sm text-muted-foreground">
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
