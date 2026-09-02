// Selective public/private Basic Auth.
// Public surface is deliberately minimal. Everything not explicitly allowed is private.
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/public",
  "/logo.png",
  "/header-final.png",
  "/asia-pacific-card-network.png",
  "/europe-card-network.png",
  "/us-card-network.png",
]);

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Atra Vigil", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const expectedUser = process.env.ATRA_SITE_USER;
  const expectedPassword = process.env.ATRA_SITE_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return unauthorized();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(authorization.slice(6).trim());
    const separator = decoded.indexOf(":");

    if (separator < 0) {
      return unauthorized();
    }

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);

    if (username !== expectedUser || password !== expectedPassword) {
      return unauthorized();
    }

    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
