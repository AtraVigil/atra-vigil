import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Atra Optio", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const expectedUser = process.env.OPTIO_BASIC_USER || "";
  const expectedPassword = process.env.OPTIO_BASIC_PASSWORD || "";

  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Optio authentication is not configured", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ")) return unauthorized();

  try {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const split = decoded.indexOf(":");
    if (split < 0) return unauthorized();

    const user = decoded.slice(0, split);
    const password = decoded.slice(split + 1);

    if (!safeEqual(user, expectedUser) || !safeEqual(password, expectedPassword)) {
      return unauthorized();
    }

    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/optio/:path*", "/api/optio-live/:path*"],
};
