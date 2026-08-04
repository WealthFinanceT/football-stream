import { NextResponse } from "next/server";

import { getStreamsBySource } from "@/services/streamed.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  try {
    const { source, id } = await params;
    console.log("[streams api] requested source", source);
    console.log("[streams api] requested id", id);
    const streams = await getStreamsBySource(source, id);
    const normalizedStreams = streams.map((stream) => ({
      id: stream.id,
      streamNo: stream.streamNo,
      language: stream.language,
      hd: stream.hd,
      embedUrl: stream.embedUrl,
      source: stream.source,
    }));

    console.log("[streams api] response", normalizedStreams);

    return NextResponse.json(normalizedStreams, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to fetch streams", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Unable to fetch streams: ${message}` }, { status: 500 });
  }
}
