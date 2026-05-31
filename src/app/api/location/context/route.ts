import { NextResponse } from "next/server";
import { enrichGeoContextWithAmap } from "../../../../lib/amap";
import { updateExpandedLocation } from "../../../../lib/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const inputGeo = body.geo && typeof body.geo === "object" ? body.geo : {};
  const amapContext = await enrichGeoContextWithAmap(inputGeo);
  const session = updateExpandedLocation({
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    geo: amapContext.geo,
    city: amapContext.city
  });

  return NextResponse.json({
    ok: true,
    pending: !session,
    city: amapContext.city,
    geo: amapContext.geo,
    places: amapContext.places,
    amap: {
      status: amapContext.status,
      reason: amapContext.reason
    },
    ...(session ? { session } : {})
  }, { status: 200 });
}
