import { NextResponse } from "next/server";
import { continueExpandedGame } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const output = continueExpandedGame({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    answer: typeof body.answer === "string" ? body.answer : undefined,
    locationDistanceMeters: Number(body.locationDistanceMeters ?? 0),
    weather: typeof body.weather === "string" ? body.weather : undefined,
    timeOfDay: typeof body.timeOfDay === "string" ? body.timeOfDay : undefined
  });

  return NextResponse.json(output ?? { error: "No active expanded session" }, { status: output ? 200 : 404 });
}
