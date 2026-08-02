"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, PlayCircle, Sparkles, Star } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMatchPath } from "@/lib/utils";
import { getFavorites, type StoredMatch } from "@/lib/persistence";

export default function FavoritesPage() {
  const [favorites] = useState<StoredMatch[]>(() => getFavorites());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">
                GoalPulse
              </p>
              <p className="text-xs text-slate-500">Favorites</p>
            </div>
          </Link>

          <Button asChild variant="ghost" className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
            <Link href="/" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="Favorites"
          description="Your saved matches are kept here so you can jump back into the action quickly."
          className="border-white/10 bg-slate-950/70"
        />

        {favorites.length === 0 ? (
          <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-300">
                <Heart className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-semibold text-white">No favorites yet</h2>
                <p className="text-sm text-slate-400">
                  Save a match you like and it will show up here for fast access later.
                </p>
              </div>
              <Button asChild className="rounded-full bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400">
                <Link href="/matches">Browse matches</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((match) => (
              <Card key={match.id} className="border-white/10 bg-slate-950/80 shadow-xl shadow-black/20">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-white">{match.title}</CardTitle>
                    <div className="rounded-full border border-amber-400/20 bg-amber-500/10 p-2 text-amber-300">
                      <Star className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    <p className="font-medium text-slate-200">{match.category ?? "Football"}</p>
                    <p className="mt-1">Saved for quick replay from your watch list.</p>
                  </div>
                  <Button asChild variant="outline" className="w-full border-white/10 bg-slate-900/70 text-slate-200 hover:bg-slate-800">
                    <Link href={buildMatchPath(match.title, match.id)} className="flex items-center justify-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Watch now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
