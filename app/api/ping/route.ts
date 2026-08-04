import { NextResponse } from "next/server";

import {
  getLiveMatches,
  getSports,
  getTodayMatches,
} from "@/services/streamed.service";

const healthCache = new Map<string, { data: unknown; checkedAt: number }>();

export const dynamic = "force-dynamic";

function getCachedValue<T>(key: string): T | null {
  const cached = healthCache.get(key);
  return cached ? (cached.data as T) : null;
}

function rememberCache(key: string, data: unknown) {
  healthCache.set(key, { data, checkedAt: Date.now() });
}

export async function GET() {
  const checks = await Promise.allSettled([
    (async () => {
      const data = await getLiveMatches();
      rememberCache("/matches/live", data);
      return { name: "/matches/live", status: "ok", data };
    })(),
    (async () => {
      const data = await getTodayMatches();
      rememberCache("/matches/all-today", data);
      return { name: "/matches/all-today", status: "ok", data };
    })(),
    (async () => {
      const data = await getSports();
      rememberCache("/sports", data);
      return { name: "/sports", status: "ok", data };
    })(),
  ]);

  const results = checks.map((result, index) => {
    const endpoint = ["/matches/live", "/matches/all-today", "/sports"][index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`[api/ping] ${endpoint} failed`, error);

    const cached = getCachedValue(endpoint);
    return {
      name: endpoint,
      status: "error",
      cached: cached !== null,
      data: cached,
      error,
    };
  });

  const hasFailures = results.some((check) => check.status === "error");

  return NextResponse.json({
    ok: !hasFailures,
    checks: results,
    cached: hasFailures,
    checkedAt: new Date().toISOString(),
  });
}
