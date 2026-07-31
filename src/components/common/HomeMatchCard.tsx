import { PlayCircle, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HomeMatchCardProps {
  title: string;
  competition: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  live?: boolean;
  className?: string;
}

export function HomeMatchCard({
  title,
  competition,
  time,
  homeTeam,
  awayTeam,
  live = false,
  className,
}: HomeMatchCardProps) {
  return (
    <Card className={cn("group overflow-hidden border-white/10 bg-slate-950/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl", className)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">{competition}</p>
            <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
          </div>
          {live ? <Badge className="border-rose-500/40 bg-rose-500/10 text-rose-300">Live</Badge> : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span className="font-medium">{homeTeam}</span>
            <span className="text-slate-400">Home</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span className="font-medium">{awayTeam}</span>
            <span className="text-slate-400">Away</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {time}
          </div>
          <div className="flex items-center gap-2 text-primary">
            <PlayCircle className="h-4 w-4" />
            Watch
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
