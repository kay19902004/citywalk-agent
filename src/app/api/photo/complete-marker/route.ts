import { NextResponse } from "next/server";
import { completeExpandedPhotoMarker } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const markerType = body.markerType === "hidden" ? "hidden" : "main";
  const output = completeExpandedPhotoMarker({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    nodeId: String(body.nodeId ?? ""),
    markerId: String(body.markerId ?? ""),
    markerType,
    clueText: String(body.clueText ?? "")
  });

  return NextResponse.json(output ?? { error: "No active expanded session" }, { status: output ? 200 : 404 });
}
