import { NextResponse } from "next/server";

import { getMatchesBySport } from "@/services/streamed.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sport: string }> },
) {
  try {
    const { sport } = await params;
    const matches = await getMatchesBySport(sport);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches", error);

    return NextResponse.json(
      { error: "Unable to fetch matches at the moment." },
      { status: 500 },
    );
  }
}
