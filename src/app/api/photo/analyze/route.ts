import { NextResponse } from "next/server";
import { getExpandedSession } from "../../../../lib/session-store";
import { analyzePhotoForOverlay } from "../../../../lib/qwen-vision";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const session = getExpandedSession(typeof body.sessionId === "string" ? body.sessionId : undefined);
  if (!session) {
    return NextResponse.json({ error: "No active expanded session" }, { status: 404 });
  }

  const nodeId = typeof body.nodeId === "string" ? body.nodeId : session.currentScene.id;
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  try {
    const overlay = await analyzePhotoForOverlay({ session, nodeId, imageBase64 });
    return NextResponse.json({ overlay });
  } catch (error) {
    const message = error instanceof Error ? error.message : "照片分析失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
