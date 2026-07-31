import { Clock3, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  title?: string;
  subtitle?: string;
  time?: string;
  league?: string;
  live?: boolean;
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: React.ReactNode;
  awayLogo?: React.ReactNode;
  className?: string;
}

export function MatchCard({
  title,
  subtitle,
  time,
  league,
  live = false,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  className,
}: MatchCardProps) {
  const fallbackTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : title;

  return (
    <article className={cn("group rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {league ?? "Featured Match"}
          </p>
          <h3 className="text-base font-semibold text-foreground">{fallbackTitle}</h3>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {live ? (
          <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-destructive">
            Live
          </span>
        ) : null}
      </div>

      {(homeTeam || awayTeam) ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-background/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {homeLogo ?? homeTeam?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{homeTeam ?? "Home"}</p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-background/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-sm font-semibold text-foreground">
              {awayLogo ?? awayTeam?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{awayTeam ?? "Away"}</p>
              <p className="text-xs text-muted-foreground">Away</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {time ? (
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            {time}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Watch now</p>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <PlayCircle className="h-4 w-4" />
          Watch
        </Button>
      </div>
    </article>
  );
}
