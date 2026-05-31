import { NextResponse } from "next/server";
import { selectExpandedRole } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const output = selectExpandedRole({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    roleId: String(body.roleId ?? ""),
    sessionSnapshot: body.session && typeof body.session === "object" ? body.session : undefined
  });

  return NextResponse.json(output ?? { error: "No active expanded session" }, { status: output ? 200 : 409 });
}
