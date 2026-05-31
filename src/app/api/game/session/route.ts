import { NextResponse } from "next/server";
import { getExpandedSession } from "../../../../lib/session-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const session = getExpandedSession(url.searchParams.get("sessionId") ?? undefined);
  return NextResponse.json(session ? { session } : { session: null });
}
