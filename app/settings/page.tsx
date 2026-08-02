"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageCircle,
  Moon,
  MonitorPlay,
  Palette,
  Send,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

import { PageHeader } from "@/components/common/PageHeader";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFavorites, getWatchHistory } from "@/lib/persistence";
import packageJson from "../../package.json";

type QualitySetting = "auto" | "720p" | "1080p";

const QUALITY_KEY = "goalpulse:quality";
const AUTOPLAY_KEY = "goalpulse:autoplay";
const EXTERNAL_PLAYER_KEY = "goalpulse:externalPlayer";

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export default function SettingsPage() {
  const { resolvedTheme } = useTheme();
  const [quality, setQuality] = useState<QualitySetting>(() =>
    readStoredValue<QualitySetting>(QUALITY_KEY, "auto"),
  );
  const [autoplay, setAutoplay] = useState(() =>
    readStoredValue<boolean>(AUTOPLAY_KEY, true),
  );
  const [externalPlayer, setExternalPlayer] = useState(() =>
    readStoredValue<boolean>(EXTERNAL_PLAYER_KEY, false),
  );
  const [watchHistoryCount, setWatchHistoryCount] = useState(() =>
    typeof window === "undefined" ? 0 : getWatchHistory().length,
  );
  const [favoritesCount, setFavoritesCount] = useState(() =>
    typeof window === "undefined" ? 0 : getFavorites().length,
  );

  useEffect(() => {
    writeStoredValue(QUALITY_KEY, quality);
  }, [quality]);

  useEffect(() => {
    writeStoredValue(AUTOPLAY_KEY, autoplay);
  }, [autoplay]);

  useEffect(() => {
    writeStoredValue(EXTERNAL_PLAYER_KEY, externalPlayer);
  }, [externalPlayer]);

  const themeLabel = resolvedTheme === "dark" ? "Dark" : "Light";

  const handleClearWatchHistory = () => {
    window.localStorage.removeItem("watchHistory");
    setWatchHistoryCount(0);
  };

  const handleClearFavorites = () => {
    window.localStorage.removeItem("favoriteMatches");
    setFavoritesCount(0);
  };

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
              <p className="text-xs text-slate-500">Settings</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          title="Settings"
          description="Customize playback, manage your saved content, and reach support in just a few taps."
          className="border-white/10 bg-slate-950/70"
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Palette className="h-5 w-5 text-emerald-400" />
                    Preferences
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-400">
                    Fine-tune your experience for smoother watching.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                  {themeLabel}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Theme</p>
                    <p className="text-sm text-slate-400">Switch between light and dark appearance.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2">
                    <Moon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{themeLabel}</span>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Default stream quality</p>
                    <p className="text-sm text-slate-400">Choose the quality you prefer by default.</p>
                  </div>
                  <label className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                    <MonitorPlay className="h-4 w-4 text-emerald-400" />
                    <select
                      aria-label="Default stream quality"
                      className="bg-transparent outline-none"
                      value={quality}
                      onChange={(event) => setQuality(event.target.value as QualitySetting)}
                    >
                      <option className="bg-slate-900 text-slate-100" value="auto">
                        Auto
                      </option>
                      <option className="bg-slate-900 text-slate-100" value="720p">
                        720p
                      </option>
                      <option className="bg-slate-900 text-slate-100" value="1080p">
                        1080p
                      </option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Autoplay next match</p>
                    <p className="text-sm text-slate-400">Continue playing the next stream automatically.</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={autoplay}
                    onClick={() => setAutoplay((value) => !value)}
                    className={`relative inline-flex h-7 w-13 items-center rounded-full transition ${autoplay ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${autoplay ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Open external player</p>
                    <p className="text-sm text-slate-400">Launch stream links in a separate player tab.</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={externalPlayer}
                    onClick={() => setExternalPlayer((value) => !value)}
                    className={`relative inline-flex h-7 w-13 items-center rounded-full transition ${externalPlayer ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${externalPlayer ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  Privacy & data
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">
                  Clear stored watch history and favorites whenever you want.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Watch history</p>
                      <p className="text-sm text-slate-400">{watchHistoryCount} saved items</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-900/80 p-2 text-slate-400">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-white/10 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                    onClick={handleClearWatchHistory}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear watch history
                  </Button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Favorites</p>
                      <p className="text-sm text-slate-400">{favoritesCount} saved matches</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-900/80 p-2 text-amber-400">
                      <Star className="h-4 w-4" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-white/10 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                    onClick={handleClearFavorites}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LifeBuoy className="h-5 w-5 text-emerald-400" />
                  Contact support
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">
                  Need help or want to share feedback? Reach out anytime.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                  <a href="https://wa.me/15551234567" target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    WhatsApp support
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                  <a href="mailto:support@goalpulse.app">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Email support
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                  <a href="https://t.me/GoalPulseSupport" target="_blank" rel="noreferrer">
                    <Send className="h-4 w-4 text-emerald-400" />
                    Telegram channel
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  App info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-400">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Version</span>
                  <span className="font-semibold text-white">v{packageJson.version}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Default profile</span>
                  <span className="font-semibold text-white">Premium streaming</span>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-300">
                  Your preferences are saved locally in this browser for a faster experience.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
