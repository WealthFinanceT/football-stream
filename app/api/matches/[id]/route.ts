import { NextResponse } from "next/server";

import { getMatchById } from "@/services/streamed.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const match = await getMatchById(id);

    return NextResponse.json(match);
  } catch (error) {
    console.error("Failed to fetch match", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Unable to fetch match details: ${message}` }, { status: 500 });
  }
}
