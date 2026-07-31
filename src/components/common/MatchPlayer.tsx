"use client";

import * as React from "react";
import { PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Stream } from "@/types/streamed";

interface MatchPlayerProps {
  streams: Stream[];
  defaultStream?: Stream;
  className?: string;
}

export function MatchPlayer({ streams, defaultStream, className }: MatchPlayerProps) {
  const [selectedStream, setSelectedStream] = React.useState<Stream | null>(defaultStream ?? streams[0] ?? null);

  React.useEffect(() => {
    setSelectedStream(defaultStream ?? streams[0] ?? null);
  }, [defaultStream, streams]);

  if (!selectedStream) {
    return (
      <div className={cn("flex aspect-video items-center justify-center rounded-[24px] border border-border/70 bg-gradient-to-br from-primary/20 via-slate-900 to-slate-800 p-6", className)}>
        <div className="rounded-full border border-white/15 bg-white/10 p-6 backdrop-blur">
          <PlayCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-[24px] border border-border/70 bg-black/80">
        <iframe
          src={selectedStream.embedUrl}
          title={`${selectedStream.source} stream`}
          className="aspect-video w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <p className="text-sm font-semibold text-foreground">Now playing</p>
        <p className="mt-1 text-sm text-muted-foreground">{selectedStream.language} · {selectedStream.source}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedStream.hd ? "HD stream" : "Standard stream"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {streams.map((stream) => {
          const active = selectedStream.id === stream.id;

          return (
            <button
              key={`${stream.source}-${stream.id}`}
              type="button"
              onClick={() => setSelectedStream(stream)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40",
                active ? "border-primary/40 bg-primary/10" : "border-border/70 bg-card/70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{stream.source}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stream.language}</p>
                </div>
                {stream.hd ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                    HD
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
