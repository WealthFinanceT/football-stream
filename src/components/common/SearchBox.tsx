"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui";
import { addRecentSearch, getRecentSearches } from "@/lib/persistence";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/common";

interface SearchBoxProps {
  className?: string;
}

export function SearchBox({ className }: SearchBoxProps) {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => getRecentSearches().map((item) => item.value));
  const { data, isLoading, isError, error } = useSearch(debouncedQuery);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const handleSearchSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(addRecentSearch(trimmed).map((item) => item.value));
  };

  return (
    <div className={cn("relative w-full", className)}>
      <label className="sr-only" htmlFor="global-search">
        Search matches, teams, and competitions
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          id="global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearchSubmit();
            }
          }}
          placeholder="Search teams, competitions, matches"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <Button variant="ghost" size="icon" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {query ? (
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-lg">
          {isLoading ? (
            <LoadingSpinner label="Searching" />
          ) : isError ? (
            <ErrorState title="Search failed" description={error instanceof Error ? error.message : "Unable to search right now."} />
          ) : data && data.length > 0 ? (
            (() => {
              const dedupeById = (list: typeof data) => {
                const s = new Set<string>();
                return list.filter((it) => {
                  const k = String(it.id);
                  if (s.has(k)) return false;
                  s.add(k);
                  return true;
                });
              };

              const unique = dedupeById(data);

              return (
                <ul className="space-y-2">
                  {unique.map((item) => (
                    <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-3 transition-colors hover:border-primary/40 hover:bg-primary/10"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
                    </div>
                    <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {item.type}
                    </span>
                  </Link>
                    </li>
                  ))}
                </ul>
              );
            })()
          ) : (
            <EmptyState title="No results found" description="Try another team, competition, or match name." />
          )}
        </div>
      ) : null}

      {!query && recentSearches.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/40"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
