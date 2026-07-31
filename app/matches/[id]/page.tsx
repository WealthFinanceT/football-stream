import Link from "next/link";
import { ArrowLeft, Clock3, Trophy } from "lucide-react";

import {
  Container,
  EmptyState,
  ErrorState,
  Footer,
  MatchCard,
  MatchPlayer,
  Navbar,
  Sidebar,
} from "@/components";
import { Button } from "@/components/ui";
import type { Match, Stream } from "@/types/streamed";
import { getMatchById, getMatchesBySport, getStreamsBySource } from "@/services/streamed.service";

function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT ?? "3000"}`;
}

// Use service layer directly on the server to avoid internal API route issues.
async function getMatchDetails(id: string) {
  const match = await getMatchById(id);
  if (!match) throw new Error("Failed to load match details");
  return match;
}

async function getStreams(source: string, id: string) {
  return await getStreamsBySource(source, id);
}

function formatDate(date: number) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

  try {
    match = await getMatchDetails(id);
    if (match) {
      const firstSource = match.sources?.[0];
      if (firstSource) {
        streams = await getStreams(firstSource.source, firstSource.id);
      }
    }
  } catch (err) {
    // If match lookup fails, attempt to treat the route as a sport category page
    try {
      sportMatches = await getMatchesBySport(id);
      if (sportMatches.length > 0) {
        isSportPage = true;
      }
    } catch (sportError) {
      error = err instanceof Error ? err.message : "Unknown error";
    }
  }

  if (isSportPage) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1">
            <Container className="py-8 sm:py-10 lg:py-12">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Sports Category</p>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{id.replace(/-/g, " ")}</h1>
                </div>
                <Button asChild variant="ghost" size="icon" className="rounded-full">
                  <Link href="/matches">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sportMatches.map((sportMatch) => (
                  <Link key={sportMatch.id} href={`/matches/${sportMatch.id}`} className="block">
                    <MatchCard
                      title={sportMatch.title}
                      subtitle={sportMatch.category}
                      time={formatDate(sportMatch.date)}
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1">
            <Container className="py-8 sm:py-10 lg:py-12">
              <ErrorState
                title="Match unavailable"
                description={error ?? "The requested match could not be loaded."}
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

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1">
            <Container className="py-8 sm:py-10 lg:py-12">
              <ErrorState
                title="Match unavailable"
                description={error ?? "The requested match could not be loaded."}
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#060816_0%,_#03050a_100%)] text-foreground">
      <Navbar />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1">
          <Container className="py-8 sm:py-10 lg:py-12">
            <div className="mb-6 flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Match Details</p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{match.title}</h1>
              </div>
            </div>

            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-card/80 shadow-2xl">
              <div className="border-b border-border/70 bg-gradient-to-r from-primary/20 via-transparent to-transparent p-5 sm:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
                      <Trophy className="mr-2 h-4 w-4" />
                      {match.category}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(match.date)}
                      </span>
                      <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-foreground">
                        {match.popular ? "Popular" : "Featured"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Home</p>
                      <p className="mt-1 font-semibold text-foreground">{match.teams?.home?.name ?? "Home"}</p>
                    </div>
                    <div className="text-2xl font-semibold text-primary">vs</div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Away</p>
                      <p className="mt-1 font-semibold text-foreground">{match.teams?.away?.name ?? "Away"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                  <MatchPlayer streams={streams} defaultStream={streams[0]} />

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      Embedded player ready
                    </div>
                    <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      {formatDate(match.date)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/70 bg-background/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Teams</p>
                      <p className="text-sm text-muted-foreground">Official match details</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Home team", value: match.teams?.home?.name ?? "Home" },
                      { label: "Away team", value: match.teams?.away?.name ?? "Away" },
                    ].map((team) => (
                      <div key={team.label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {team.value.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{team.value}</p>
                          <p className="text-xs text-muted-foreground">{team.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Available Streams</h2>
                  <p className="text-sm text-muted-foreground">Select a stream to switch the embedded player instantly.</p>
                </div>
              </div>

              {streams.length === 0 ? (
                <EmptyState title="No streams available" description="This match does not have streams right now. Please check back later." />
              ) : null}
            </section>
          </Container>
        </main>
      </div>
      <Footer />
    </div>
  );
}
