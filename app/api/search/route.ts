import { NextResponse } from "next/server";

import { buildMatchPath } from "@/lib/utils";
import type { Match, Sport } from "@/types/streamed";

async function getMatches() {
  const res = await fetch("http://localhost:3000/api/matches/live", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load matches");
  }

  return (await res.json()) as Match[];
}

async function getSports() {
  const res = await fetch("http://localhost:3000/api/sports", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load sports");
  }

  return (await res.json()) as Sport[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (!query) {
      return NextResponse.json([]);
    }

    const [matches, sports] = await Promise.all([getMatches(), getSports()]);

    console.log(`[API_ROUTE] /api/search -> matches=${matches.length} targetCount=${matches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`);

    const results = [
      ...matches
        .filter((match) => {
          const haystack = [
            match.title,
            match.category,
            match.teams?.home?.name,
            match.teams?.away?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
        .map((match) => ({
          id: match.id,
          title: match.title,
          type: "match" as const,
          subtitle: match.category,
          href: buildMatchPath(match.title, match.id),
        })),
      ...sports
        .filter((sport) => sport.name.toLowerCase().includes(query) || sport.id.toLowerCase().includes(query))
        .map((sport) => ({
          id: sport.id,
          title: sport.name,
          type: "competition" as const,
          subtitle: sport.id,
          href: `/leagues/${sport.id}`,
        })),
      ...matches
        .flatMap((match) => [
          match.teams?.home?.name && {
            id: `${match.id}-home`,
            title: match.teams.home.name,
            type: "team" as const,
            subtitle: "Home team",
            href: buildMatchPath(match.title, match.id),
          },
          match.teams?.away?.name && {
            id: `${match.id}-away`,
            title: match.teams.away.name,
            type: "team" as const,
            subtitle: "Away team",
            href: buildMatchPath(match.title, match.id),
          },
        ].filter(Boolean))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    ];

    return NextResponse.json(results.slice(0, 8));
  } catch (error) {
    console.error("Search failed", error);
    return NextResponse.json(
      { error: "Unable to complete search right now." },
      { status: 500 },
    );
  }
}
