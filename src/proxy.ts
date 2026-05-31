import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.startsWith("127.0.0.1")) {
    return NextResponse.next();
  }

  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
  const target = `http://localhost${port}${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (request.method === "HEAD") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Redirect-Target": target
      }
    });
  }

  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Redirecting</title><script>location.replace(${JSON.stringify(
      target
    )});</script><a href="${target}">Open CityWalk Adventure</a>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Redirect-Target": target
      }
    }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
