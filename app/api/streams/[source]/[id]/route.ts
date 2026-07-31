import { NextResponse } from "next/server";

import { getStreamsBySource } from "@/services/streamed.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  try {
    const { source, id } = await params;
    const streams = await getStreamsBySource(source, id);

    return NextResponse.json(streams);
  } catch (error) {
    console.error("Failed to fetch streams", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Unable to fetch streams: ${message}` }, { status: 500 });
  }
}
