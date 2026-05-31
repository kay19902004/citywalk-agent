import { NextResponse } from "next/server";
import { startExpandedGame } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const output = await startExpandedGame({
      preference: String(body.preference ?? "治愈"),
      weather: String(body.weather ?? "晴"),
      timeOfDay: String(body.timeOfDay ?? "下午"),
      city: String(body.city ?? "本地城市"),
      geo: body.geo && typeof body.geo === "object" ? body.geo : undefined
    });

    return NextResponse.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeepSeek 生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
