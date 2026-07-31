import { NextResponse } from "next/server";

import { getSports } from "@/services/streamed.service";

export async function GET() {
  try {
    const sports = await getSports();

    return NextResponse.json(sports);
  } catch (error) {
    console.error("Failed to fetch sports", error);

    return NextResponse.json(
      { error: "Unable to fetch sports at the moment." },
      { status: 500 },
    );
  }
}
