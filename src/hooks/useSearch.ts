"use client";

import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: string;
  title: string;
  type: "match" | "competition" | "team";
  subtitle?: string;
  href: string;
}

async function searchContent(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Unable to search right now.");
  }

  return (await response.json()) as SearchResult[];
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchContent(query),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
}
