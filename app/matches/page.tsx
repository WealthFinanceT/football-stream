import Link from "next/link";

export default function MatchesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 rounded-[32px] border border-white/10 bg-card/80 px-6 py-8 shadow-2xl shadow-black/20 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Matches</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Browse football fixtures</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Explore live matches now or jump to the full match hub for the latest fixtures and schedules.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/matches/live"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              View Live Matches
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/matches/live"
            className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">Live Matches</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Current fixtures happening now</h2>
            <p className="mt-3 text-sm text-slate-400">Browse the live matches endpoint and open any match with one click.</p>
          </Link>

          <Link
            href="/"
            className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">Homepage</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Featured football stream feed</h2>
            <p className="mt-3 text-sm text-slate-400">Return to the main page for featured live and popular match highlights.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
