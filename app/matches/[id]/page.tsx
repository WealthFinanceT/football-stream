import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Container,
  ErrorState,
  Footer,
  MatchCard,
  MatchCommandCenter,
  Navbar,
  Sidebar,
} from "@/components";
import { Button } from "@/components/ui";
import { formatMatchDateTime } from "@/lib/date";
import { buildMatchPath } from "@/lib/utils";
import type { Match, Stream } from "@/types/streamed";
import {
  getLiveMatches,
  getLivePopularMatches,
  getMatchById,
  getMatchesBySport,
  getStreamsBySource,
} from "@/services/streamed.service";

async function getMatchDetails(id: string) {
  const match = await getMatchById(id);
  if (!match) throw new Error("Failed to load match details");
  return match;
}

async function getStreams(source: string, id: string) {
  return await getStreamsBySource(source, id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchById(id).catch(() => null);
  const slug = id.replace(/-/g, " ");
  const title = match ? `${match.title} | GoalPulse` : `${slug} | GoalPulse`;
  const description = match
    ? `Watch ${match.title} with live streams, premium sports coverage, and match details on GoalPulse.`
    : `Explore live sports matches and streams for ${slug} on GoalPulse.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/matches/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/matches/${id}`,
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: "GoalPulse live sports streaming preview",
        },
      ],
    },
    twitter: {
      title,
      description,
      images: ["/og-image.svg"],
    },
  };
}

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let match: Match | null = null;
  let streams: Stream[] = [];
  let sportMatches: Match[] = [];
  let error: string | null = null;
  let isSportPage = false;

  let relatedLiveMatches: Match[] = [];
  let popularMatches: Match[] = [];

  try {
    match = await getMatchDetails(id);
    if (match) {
      const firstSource = match.sources?.[0];
      const [liveResult, popularResult, streamResult] = await Promise.allSettled([
        getLiveMatches(),
        getLivePopularMatches(),
        firstSource
          ? getStreams(firstSource.source, firstSource.id)
          : Promise.resolve([]),
      ]);

      relatedLiveMatches = liveResult.status === "fulfilled" ? liveResult.value : [];
      popularMatches = popularResult.status === "fulfilled" ? popularResult.value : [];
      streams = streamResult.status === "fulfilled" ? streamResult.value : [];
    }
  } catch (err) {
    try {
      sportMatches = await getMatchesBySport(id);
      if (sportMatches.length > 0) {
        isSportPage = true;
      }
    } catch {
      error = err instanceof Error ? err.message : "Unknown error";
    }
  }

  if (isSportPage) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <Container className="mx-auto max-w-screen-xl py-8 sm:py-10 lg:py-12">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                    Sports Category
                  </p>
                  <h1 className="max-w-full break-words text-2xl font-semibold tracking-tight text-foreground">
                    {id.replace(/-/g, " ")}
                  </h1>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Link href="/matches">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sportMatches.map((sportMatch) => (
                  <Link
                    key={sportMatch.id}
                    href={buildMatchPath(sportMatch.title, sportMatch.id)}
                    className="block"
                  >
                    <MatchCard
                      title={sportMatch.title}
                      subtitle={sportMatch.category}
                      time={formatMatchDateTime(sportMatch.date)}
                      league={sportMatch.category}
                      homeTeam={sportMatch.teams?.home?.name ?? "Home"}
                      awayTeam={sportMatch.teams?.away?.name ?? "Away"}
                    />
                  </Link>
                ))}
              </section>
            </Container>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <Container className="mx-auto max-w-screen-xl py-8 sm:py-10 lg:py-12">
              <ErrorState
                title="Match unavailable"
                description={
                  error ?? "The requested match could not be loaded."
                }
                action={
                  <Button asChild variant="secondary">
                    <Link href="/">Back to home</Link>
                  </Button>
                }
              />
            </Container>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
      <Navbar />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <Container className="mx-auto max-w-screen-xl py-8 sm:py-10 lg:py-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                  Match Details
                </p>
                <h1 className="max-w-full break-words text-2xl font-semibold tracking-tight text-foreground">
                  {match.title}
                </h1>
              </div>
            </div>

            <MatchCommandCenter
              match={match}
              streams={streams}
              relatedLiveMatches={relatedLiveMatches}
              popularMatches={popularMatches}
            />
          </Container>
        </main>
      </div>
      <Footer />
    </div>
  );
}
