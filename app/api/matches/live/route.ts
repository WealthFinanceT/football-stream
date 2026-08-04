import { NextResponse } from "next/server";

import { getLiveMatches } from "@/services/streamed.service";

export const revalidate = 30;

export async function GET() {
  try {
    const matches = await getLiveMatches();
    console.log(`[API_ROUTE] /api/matches/live -> matches=${matches.length} targetCount=${matches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch live matches", error);

    return NextResponse.json(
      { error: "Unable to fetch live matches at the moment." },
      { status: 500 },
    );
  }
}
