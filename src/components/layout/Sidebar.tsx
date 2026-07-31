import Link from "next/link";
import { Home, Tv, CalendarDays, Clapperboard, Search, Star, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches/live", label: "Live Matches", icon: Tv },
  { href: "/matches", label: "Today", icon: CalendarDays },
  { href: "/search", label: "Search", icon: Search },
  { href: "/leagues", label: "Leagues", icon: Clapperboard },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  className?: string;
}

export function Sidebar({ open = true, className }: SidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className={cn("hidden w-72 shrink-0 border-r border-border/80 bg-card/40 lg:flex", className)}>
      <div className="flex w-full flex-col gap-2 p-4">
        <div className="px-2 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Explore
          </p>
        </div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
