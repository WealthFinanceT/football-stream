import { NextResponse } from "next/server";

import { getAllMatches } from "@/services/streamed.service";

export async function GET() {
  try {
    const matches = await getAllMatches();
    console.log(`[API_ROUTE] /api/matches/all -> matches=${matches.length} targetCount=${matches.filter(m=>String(m.id)==="ppv-tottenham-hotspur-vs-tsg-hoffenheim").length}`);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch all matches", error);

    return NextResponse.json(
      { error: "Unable to fetch all matches at the moment." },
      { status: 500 },
    );
  }
}
