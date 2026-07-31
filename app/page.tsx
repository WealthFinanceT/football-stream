import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Sparkles, Trophy } from "lucide-react";

import { LiveMatchCenter } from "@/components/common/LiveMatchCenter";
import { LiveNowCard } from "@/components/common/LiveNowCard";
import { LeagueCard } from "@/components/common/LeagueCard";
import { MatchCard } from "@/components/common/MatchCard";
import { FeaturedMatchSpotlight } from "@/components/common/FeaturedMatchSpotlight";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui";
import {
  getLiveMatches,
  getLivePopularMatches,
  getSports,
  getTodayMatches,
} from "@/services/streamed.service";
import type { Match, Sport } from "@/types/streamed";

function formatDate(date: number) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const liveMatches = await getLiveMatches();
    const liveCount = liveMatches.length;

    return {
      title:
        liveCount > 0
          ? `Live football now · ${liveCount} streams`
          : "Live football streaming",
      description:
        liveCount > 0
          ? `Catch ${liveCount} live football streams and premium match coverage on GoalPulse.`
          : "Discover live football streams, match highlights, and premium football coverage on GoalPulse.",
      alternates: {
        canonical: "/",
      },
      openGraph: {
        title:
          liveCount > 0
            ? `GoalPulse · ${liveCount} live football streams`
            : "GoalPulse · Live football streaming",
        description:
          liveCount > 0
            ? `Catch ${liveCount} live football streams and premium match coverage on GoalPulse.`
            : "Discover live football streams, match highlights, and premium football coverage on GoalPulse.",
        url: "/",
        images: [
          {
            url: "/og-image.svg",
            width: 1200,
            height: 630,
            alt: "GoalPulse football streaming preview",
          },
        ],
      },
      twitter: {
        title:
          liveCount > 0
            ? `GoalPulse · ${liveCount} live football streams`
            : "GoalPulse · Live football streaming",
        description:
          liveCount > 0
            ? `Catch ${liveCount} live football streams and premium match coverage on GoalPulse.`
            : "Discover live football streams, match highlights, and premium football coverage on GoalPulse.",
        images: ["/og-image.svg"],
      },
    };
  } catch {
    return {
      title: "GoalPulse | Live football streaming",
      description:
        "Discover live football streams, match highlights, and premium football coverage on GoalPulse.",
      alternates: {
        canonical: "/",
      },
    };
  }
}

function matchBadgeUrl(badge?: string) {
  return badge
    ? `https://streamed.pk/api/images/badge/${badge}.webp`
    : undefined;
}

function SectionState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-8 text-center text-slate-300">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default async function HomePage() {
  let sports: Sport[] = [];
  let liveMatches: Match[] = [];
  let todayMatches: Match[] = [];
  let popularMatches: Match[] = [];
  let error: string | null = null;

  try {
    const [sportsData, liveData, todayData, popularData] = await Promise.all([
      getSports(),
      getLiveMatches(),
      getTodayMatches(),
      getLivePopularMatches(),
    ]);

    sports = sportsData;
    liveMatches = liveData;
    todayMatches = todayData;
    popularMatches = popularData;
    console.log(
      `[PAGE_APP] live=${liveMatches.length} today=${todayMatches.length} popular=${popularMatches.length} targetInLive=${liveMatches.filter((m) => String(m.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length} targetInToday=${todayMatches.filter((m) => String(m.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length} targetInPopular=${popularMatches.filter((m) => String(m.id) === "ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`,
    );
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Unable to load football data.";
  }

  const heroMatch = liveMatches[0];
  const now = 1767225600000;

  const uniqueById = (list: Match[]) =>
    list.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));

  const uniqueLive = uniqueById(liveMatches);
  const uniqueToday = uniqueById(todayMatches);
  const uniquePopular = uniqueById(popularMatches);

  const seen = new Set<string>();
  const filteredLive = uniqueLive.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  const filteredToday = uniqueToday.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  const filteredPopular = uniquePopular.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const dedupeById = (list: Match[]) => {
    const s = new Set<string>();
    return list.filter((m) => {
      const k = String(m.id);
      if (s.has(k)) return false;
      s.add(k);
      return true;
    });
  };

  const finalLive = dedupeById(filteredLive);
  const finalToday = dedupeById(filteredToday);
  const finalPopular = dedupeById(filteredPopular);
  const liveStreamsCount = finalLive.reduce(
    (count, match) => count + (match.sources?.length ?? 0),
    0,
  );
  const trendingMatches = finalPopular.slice(0, 5);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">
                GoalPulse
              </p>
              <p className="text-xs text-slate-500">Live football</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/matches/live" className="transition hover:text-white">
              Live
            </Link>
            <Link href="/matches" className="transition hover:text-white">
              Matches
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 sm:flex">
              <PlayCircle className="mr-2 h-4 w-4 text-emerald-400" />
              Watch now
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 sm:p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_35%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-slate-950/70 to-slate-950" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Premium football streaming
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Watch Football Live
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
                  Discover live matches, premium highlights, and the biggest
                  football moments directly from the Streamed API.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  <Link
                    href={heroMatch ? `/matches/${heroMatch.id}` : "/matches"}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch Live
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10"
                >
                  <Link href="#sports">Explore Sports</Link>
                </Button>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
              <p className="mb-2 text-sm font-semibold text-emerald-300">
                Now streaming
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-lg font-semibold text-white">
                  {heroMatch?.title ?? "Live football coverage"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {heroMatch
                    ? `${heroMatch.category} · ${formatDate(heroMatch.date)}`
                    : "Real-time football action from the official API."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <FeaturedMatchSpotlight
          match={
            finalLive[0] ??
            heroMatch ?? {
              id: "featured-placeholder",
              title: "No featured live match available",
              category: "Live Spotlight",
              date: now,
              popular: false,
              sources: [],
            }
          }
        />

        <LiveMatchCenter
          liveMatches={finalLive}
          todayMatchesCount={finalToday.length}
          sportsCount={sports.length}
          hdStreamsCount={liveStreamsCount}
          trendingMatches={trendingMatches}
        />

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">
                Top Leagues
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Elite competitions
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Jump into the world&apos;s most prestigious football leagues
                with premium coverage.
              </p>
            </div>
            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              Browse all matches
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <LeagueCard
              href="/matches/premier-league"
              title="Premier League"
              accent="#1f7f2d"
              logo={<span className="text-lg font-bold">PL</span>}
            />
            <LeagueCard
              href="/matches/champions-league"
              title="Champions League"
              accent="#27486b"
              logo={<span className="text-lg font-bold">UCL</span>}
            />
            <LeagueCard
              href="/matches/la-liga"
              title="La Liga"
              accent="#c10000"
              logo={<span className="text-lg font-bold">LL</span>}
            />
            <LeagueCard
              href="/matches/serie-a"
              title="Serie A"
              accent="#005e6b"
              logo={<span className="text-lg font-bold">SA</span>}
            />
            <LeagueCard
              href="/matches/bundesliga"
              title="Bundesliga"
              accent="#e30513"
              logo={<span className="text-lg font-bold">BL</span>}
            />
            <LeagueCard
              href="/matches/ligue-1"
              title="Ligue 1"
              accent="#003f6b"
              logo={<span className="text-lg font-bold">L1</span>}
            />
          </div>
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Live Now</h2>
              <p className="text-sm text-slate-400">
                Premium matches streaming right now with instant access.
              </p>
            </div>
            <Link
              href="/matches/live"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              View all live matches
            </Link>
          </div>
          {error ? (
            <SectionState
              title="Unable to load live matches"
              description={error}
            />
          ) : liveMatches.length === 0 ? (
            <SectionState
              title="No live matches available"
              description="The service is currently returning no live events."
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
              {finalLive.slice(0, 6).map((match) => (
                <LiveNowCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Today&apos;s Matches
              </h2>
              <p className="text-sm text-slate-400">
                Your curated schedule for the day with premium football
                fixtures.
              </p>
            </div>
            <Link
              href="/matches"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              Browse all matches
            </Link>
          </div>
          {error ? (
            <SectionState
              title="Unable to load today's matches"
              description={error}
            />
          ) : todayMatches.length === 0 ? (
            <SectionState
              title="No matches scheduled today"
              description="Check back later for upcoming fixtures."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {finalToday.slice(0, 8).map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block"
                >
                  <MatchCard
                    title={match.title}
                    subtitle={match.category}
                    time={formatDate(match.date)}
                    league={match.category}
                    homeTeam={match.teams?.home?.name ?? "Home"}
                    awayTeam={match.teams?.away?.name ?? "Away"}
                    homeLogo={
                      match.teams?.home?.badge ? (
                        <Image
                          src={matchBadgeUrl(match.teams.home.badge) ?? ""}
                          alt={match.teams.home.name ?? "Home team"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : undefined
                    }
                    awayLogo={
                      match.teams?.away?.badge ? (
                        <Image
                          src={matchBadgeUrl(match.teams.away.badge) ?? ""}
                          alt={match.teams.away.name ?? "Away team"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : undefined
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Popular Matches
            </h2>
            <p className="text-sm text-slate-400">
              Fan-favorite live fixtures from the popular endpoint.
            </p>
          </div>
          {error ? (
            <SectionState
              title="Unable to load popular matches"
              description={error}
            />
          ) : popularMatches.length === 0 ? (
            <SectionState
              title="No popular matches available"
              description="There are no popular live matches to display right now."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {finalPopular.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block"
                >
                  <MatchCard
                    title={match.title}
                    subtitle={match.category}
                    time={formatDate(match.date)}
                    league={match.category}
                    live={match.popular}
                    homeTeam={match.teams?.home?.name ?? "Home"}
                    awayTeam={match.teams?.away?.name ?? "Away"}
                    homeLogo={
                      match.teams?.home?.badge ? (
                        <Image
                          src={matchBadgeUrl(match.teams.home.badge) ?? ""}
                          alt={match.teams.home.name ?? "Home team"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : undefined
                    }
                    awayLogo={
                      match.teams?.away?.badge ? (
                        <Image
                          src={matchBadgeUrl(match.teams.away.badge) ?? ""}
                          alt={match.teams.away.name ?? "Away team"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : undefined
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="sports" className="mt-10 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Sports Categories
            </h2>
            <p className="text-sm text-slate-400">
              Browse the sport categories exposed by the Streamed API.
            </p>
          </div>
          {error ? (
            <SectionState title="Unable to load sports" description={error} />
          ) : sports.length === 0 ? (
            <SectionState
              title="No sports categories available"
              description="The API has not returned any sport categories yet."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {sports.map((sport) => (
                <Link
                  key={sport.id}
                  href={`/matches/${sport.id}`}
                  className="group rounded-[22px] border border-white/10 bg-slate-950/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{sport.name}</p>
                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 transition group-hover:scale-110">
                      <Trophy className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Open {sport.name.toLowerCase()} coverage
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 GoalPulse. Football, reimagined.</p>
          <div className="flex gap-4">
            <a href="#" className="transition hover:text-white">
              About
            </a>
            <a href="#" className="transition hover:text-white">
              Support
            </a>
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
