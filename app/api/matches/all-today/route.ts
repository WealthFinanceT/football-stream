import { NextResponse } from "next/server";

import { getTodayMatches } from "@/services/streamed.service";

export const revalidate = 30;

export async function GET() {
  try {
    const matches = await getTodayMatches();
    console.log(`[API_ROUTE] /api/matches/all-today -> matches=${matches.length} targetCount=${matches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch today's matches", error);

    return NextResponse.json(
      { error: "Unable to fetch today's matches at the moment." },
      { status: 500 },
    );
  }
}
