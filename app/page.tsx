import Link from "next/link";
import { CalendarDays, Clock3, PlayCircle, Sparkles, Trophy } from "lucide-react";

import { MatchCard } from "@/components/common/MatchCard";
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

function matchBadgeUrl(badge?: string) {
  return badge ? `https://streamed.pk/api/images/badge/${badge}.webp` : undefined;
}

function SectionState({ title, description }: { title: string; description: string }) {
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
    console.log(`[PAGE_APP] live=${liveMatches.length} today=${todayMatches.length} popular=${popularMatches.length} targetInLive=${liveMatches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length} targetInToday=${todayMatches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length} targetInPopular=${popularMatches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load football data.";
  }

  const heroMatch = liveMatches[0];

  const uniqueById = (list: Match[]) => list.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));

  const uniqueLive = uniqueById(liveMatches);
  const uniqueToday = uniqueById(todayMatches);
  const uniquePopular = uniqueById(popularMatches);

  // Ensure matches are not repeated across the three primary sections
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

  // Final strict dedupe to handle id type mismatches and duplicate entries
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">GoalPulse</p>
              <p className="text-xs text-slate-500">Live football</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <Link href="/matches/live" className="transition hover:text-white">Live</Link>
            <Link href="/matches" className="transition hover:text-white">Matches</Link>
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
                  Discover live matches, premium highlights, and the biggest football moments directly from the Streamed API.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
                  <Link href={heroMatch ? `/matches/${heroMatch.id}` : "/matches"}>
                    <PlayCircle className="h-4 w-4" />
                    Watch Live
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10">
                  <Link href="#sports">Explore Sports</Link>
                </Button>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
              <p className="mb-2 text-sm font-semibold text-emerald-300">Now streaming</p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-lg font-semibold text-white">{heroMatch?.title ?? "Live football coverage"}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {heroMatch ? `${heroMatch.category} · ${formatDate(heroMatch.date)}` : "Real-time football action from the official API."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[2fr_1fr] xl:items-start xl:gap-8">
          <div className="space-y-4">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Sports Categories</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Browse sport categories</h2>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400">Explore the sport categories exposed by the Streamed API so users can find matches to stream quickly.</p>
                </div>
                <Link
                  href="/matches"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
                >
                  Browse all matches
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {sports.map((sport) => (
                <Link
                  key={sport.id}
                  href={`/matches/${sport.id}`}
                  className="group overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">{sport.name}</p>
                  <p className="mt-3 text-sm text-slate-400">Open {sport.name.toLowerCase()} coverage</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-2xl shadow-black/30">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Quick sports access</p>
              <h2 className="text-3xl font-semibold text-white">Find matches faster</h2>
              <p className="text-sm leading-7 text-slate-400">
                Sports categories are now above the fold so users can instantly jump to the competition they want and start streaming.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-sm font-semibold text-white">Popular shortcuts</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/matches/soccer" className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20">Soccer</Link>
                  <Link href="/matches/basketball" className="rounded-full bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700">Basketball</Link>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-sm font-semibold text-white">Need live action?</p>
                <p className="mt-2 text-sm text-slate-400">Open the live matches page to see current streamed events in real time.</p>
                <Link href="/matches/live" className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">View live matches</Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Live Matches</h2>
              <p className="text-sm text-slate-400">Real-time matches from the documented live endpoint.</p>
            </div>
          </div>
          {error ? (
            <SectionState title="Unable to load live matches" description={error} />
          ) : liveMatches.length === 0 ? (
            <SectionState title="No live matches available" description="The service is currently returning no live events." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {finalLive.map((match) => (
                <div key={match.id} className="min-w-[280px] flex-1 sm:min-w-[320px]">
                  <Link href={`/matches/${match.id}`} className="block">
                    <MatchCard
                      title={match.title}
                      subtitle={match.category}
                      time={formatDate(match.date)}
                      league={match.category}
                      live
                      homeTeam={match.teams?.home?.name ?? "Home"}
                      awayTeam={match.teams?.away?.name ?? "Away"}
                      homeLogo={match.teams?.home?.badge ? <img src={matchBadgeUrl(match.teams.home.badge)} alt={match.teams.home.name ?? "Home team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                      awayLogo={match.teams?.away?.badge ? <img src={matchBadgeUrl(match.teams.away.badge)} alt={match.teams.away.name ?? "Away team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Today&apos;s Matches</h2>
            <p className="text-sm text-slate-400">Matches scheduled for today from the official API.</p>
          </div>
          {error ? (
            <SectionState title="Unable to load today&apos;s matches" description={error} />
          ) : todayMatches.length === 0 ? (
            <SectionState title="No matches scheduled today" description="Check back later for upcoming fixtures." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {finalToday.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="block">
                  <MatchCard
                    title={match.title}
                    subtitle={match.category}
                    time={formatDate(match.date)}
                    league={match.category}
                    homeTeam={match.teams?.home?.name ?? "Home"}
                    awayTeam={match.teams?.away?.name ?? "Away"}
                    homeLogo={match.teams?.home?.badge ? <img src={matchBadgeUrl(match.teams.home.badge)} alt={match.teams.home.name ?? "Home team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                    awayLogo={match.teams?.away?.badge ? <img src={matchBadgeUrl(match.teams.away.badge)} alt={match.teams.away.name ?? "Away team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Popular Matches</h2>
            <p className="text-sm text-slate-400">Fan-favorite live fixtures from the popular endpoint.</p>
          </div>
          {error ? (
            <SectionState title="Unable to load popular matches" description={error} />
          ) : popularMatches.length === 0 ? (
            <SectionState title="No popular matches available" description="There are no popular live matches to display right now." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {finalPopular.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="block">
                  <MatchCard
                    title={match.title}
                    subtitle={match.category}
                    time={formatDate(match.date)}
                    league={match.category}
                    live={match.popular}
                    homeTeam={match.teams?.home?.name ?? "Home"}
                    awayTeam={match.teams?.away?.name ?? "Away"}
                    homeLogo={match.teams?.home?.badge ? <img src={matchBadgeUrl(match.teams.home.badge)} alt={match.teams.home.name ?? "Home team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                    awayLogo={match.teams?.away?.badge ? <img src={matchBadgeUrl(match.teams.away.badge)} alt={match.teams.away.name ?? "Away team"} className="h-10 w-10 rounded-full object-cover" /> : undefined}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="sports" className="mt-10 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Sports Categories</h2>
            <p className="text-sm text-slate-400">Browse the sport categories exposed by the Streamed API.</p>
          </div>
          {error ? (
            <SectionState title="Unable to load sports" description={error} />
          ) : sports.length === 0 ? (
            <SectionState title="No sports categories available" description="The API has not returned any sport categories yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {sports.map((sport) => (
                <Link key={sport.id} href={`/matches/${sport.id}`} className="group rounded-[22px] border border-white/10 bg-slate-950/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{sport.name}</p>
                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 transition group-hover:scale-110">
                      <Trophy className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Open {sport.name.toLowerCase()} coverage</p>
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
            <a href="#" className="transition hover:text-white">About</a>
            <a href="#" className="transition hover:text-white">Support</a>
            <a href="#" className="transition hover:text-white">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
