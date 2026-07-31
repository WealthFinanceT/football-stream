import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("animate-pulse rounded-2xl border border-border/70 bg-card/60 p-4", className)}>
      <div className="space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-muted" />
        <div className="h-3 w-1/2 rounded-full bg-muted" />
        <div className="h-24 rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}
