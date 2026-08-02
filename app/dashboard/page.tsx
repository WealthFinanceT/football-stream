"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock3, Heart, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui";
import { buildMatchPath } from "@/lib/utils";
import { getFavorites, getRecentSearches, getWatchHistory, type StoredMatch, type StoredSearch } from "@/lib/persistence";

function formatDate(date?: number) {
  if (!date) return "Recently viewed";
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardPage() {
  const [favorites] = useState<StoredMatch[]>(() => getFavorites());
  const [watchHistory] = useState<StoredMatch[]>(() => getWatchHistory());
  const [recentSearches] = useState<StoredSearch[]>(() => getRecentSearches());

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your football command center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Keep track of your favorite matches, continue watching, and revisit recent searches without leaving the app.</p>
          </div>
          <Button asChild variant="secondary" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white hover:bg-white/10">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-300">
                <Heart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Favorites</p>
                <p className="text-xs text-slate-400">Saved matches</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{favorites.length}</p>
            <p className="mt-2 text-sm text-slate-400">Quick access to the fixtures you want to keep close.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-sky-500/10 p-2 text-sky-300">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Continue watching</p>
                <p className="text-xs text-slate-400">Recently opened</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{watchHistory.length}</p>
            <p className="mt-2 text-sm text-slate-400">Resume from the latest match sessions you opened.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-violet-500/10 p-2 text-violet-300">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Recent searches</p>
                <p className="text-xs text-slate-400">Quick jumps</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{recentSearches.length}</p>
            <p className="mt-2 text-sm text-slate-400">Revisit teams and competitions you searched for recently.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Favorites</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Saved matches</h2>
              </div>
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-6 space-y-3">
              {favorites.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">No favorites yet. Open a match and tap the heart icon to save it here.</div>
              ) : (
                favorites.map((item) => (
                  <Link key={item.id} href={buildMatchPath(item.title, item.id)} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-emerald-400/40 hover:bg-white/10">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.category ?? "Football match"}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Open</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-sky-300">History</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recently viewed matches</h2>
              </div>
              <Clock3 className="h-5 w-5 text-sky-300" />
            </div>
            <div className="mt-6 space-y-3">
              {watchHistory.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">No recent match history yet. Start watching follow-up matches to fill this section.</div>
              ) : (
                watchHistory.map((item) => (
                  <Link key={item.id} href={buildMatchPath(item.title, item.id)} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-sky-400/40 hover:bg-white/10">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(item.viewedAt)}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Resume</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
