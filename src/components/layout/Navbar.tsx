import Link from "next/link";
import { Menu, Tv } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SearchBox, ThemeToggle } from "@/components/common";

interface NavbarProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Navbar({
  title = "GoalPulse",
  actions,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tv className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">Live sports experience</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden w-72 md:block">
            <SearchBox />
          </div>
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}
