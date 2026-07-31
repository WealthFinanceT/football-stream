"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] px-4 text-slate-50">
      <div className="w-full max-w-lg rounded-[32px] border border-rose-500/20 bg-slate-950/80 p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-white">Something went wrong</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The football experience hit a snag while loading live content. You can retry or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
