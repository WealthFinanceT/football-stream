import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,_#050816_0%,_#02030a_100%)] px-4 text-slate-50">
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-slate-950/80 px-8 py-8 shadow-2xl shadow-black/20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Loading dashboard</p>
          <p className="mt-1 text-sm text-slate-400">Pulling in favorites, history, and recent searches.</p>
        </div>
      </div>
    </div>
  );
}
