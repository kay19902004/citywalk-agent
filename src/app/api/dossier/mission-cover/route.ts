import { NextResponse } from "next/server";
import { generateExpandedMissionCover } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await generateExpandedMissionCover({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined
  });

  if (!result) {
    return NextResponse.json({ error: "No active expanded session" }, { status: 404 });
  }

  return NextResponse.json({
    session: result.session,
    status: result.status,
    url: result.url
  });
}
