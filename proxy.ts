import { NextRequest, NextResponse } from "next/server";

const REALM = "Atra Vigil";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

function getRouteAuth(pathname: string) {
  let routeKey = "COMMON";

  const username =
    process.env.ATRA_PROTECTED_USERNAME ||
    process.env.BASIC_AUTH_USERNAME ||
    process.env.BASIC_AUTH_USER ||
    process.env.AUTH_USERNAME ||
    process.env.AUTH_USER ||
    "";

  const commonPassword =
    process.env.ATRA_PROTECTED_PASSWORD ||
    process.env.BASIC_AUTH_PASSWORD ||
    process.env.AUTH_PASSWORD ||
    "";

  let password = commonPassword;
  let realm = REALM;

  if (pathname.startsWith("/atraprae")) {
    password = process.env.ATRA_PRAE_PASSWORD || commonPassword;
    routeKey = "ATRA_PRAE_PASSWORD";
    realm = "Atra Prae";
  } else if (
    pathname.startsWith("/atraoptio") ||
    pathname.startsWith("/api/atra-optio-dashboard")
  ) {
    password = process.env.ATRA_OPTIO_PASSWORD || commonPassword;
    routeKey = "ATRA_OPTIO_PASSWORD";
    realm = "Atra Optio";
  } else if (pathname.startsWith("/atralectio")) {
    password = process.env.ATRA_LECTIO_PASSWORD || commonPassword;
    routeKey = "ATRA_LECTIO_PASSWORD";
    realm = "Atra Lectio";
  } else if (pathname.startsWith("/atradis")) {
    password = process.env.ATRA_DIS_PASSWORD || commonPassword;
    routeKey = "ATRA_DIS_PASSWORD";
    realm = "Atra Dis";
  }

  return { username, password, realm, routeKey };
}

function unauthorized(realm: string, debug: Record<string, string> = {}) {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`,
      "Cache-Control": "no-store",
      ...debug,
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { username, password, realm, routeKey } = getRouteAuth(pathname);

  const debugHeaders = {
    "X-Atra-Auth-Realm": realm,
    "X-Atra-Auth-Route-Key": routeKey,
    "X-Atra-Auth-Username-Present": username ? "YES" : "NO",
    "X-Atra-Auth-Password-Present": password ? "YES" : "NO",
    "X-Atra-Auth-Username-Length": String(username.length),
    "X-Atra-Auth-Password-Length": String(password.length),
  };

  if (!username || !password) {
    return unauthorized(realm, debugHeaders);
  }

  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Basic ")) {
    return unauthorized(realm, debugHeaders);
  }

  let suppliedUsername = "";
  let suppliedPassword = "";

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const splitAt = decoded.indexOf(":");

    if (splitAt >= 0) {
      suppliedUsername = decoded.slice(0, splitAt);
      suppliedPassword = decoded.slice(splitAt + 1);
    }
  } catch {
    return unauthorized(realm, debugHeaders);
  }

  if (!safeEqual(suppliedUsername, username) || !safeEqual(suppliedPassword, password)) {
    return unauthorized(realm, debugHeaders);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/atraprae/:path*",
    "/atraoptio/:path*",
    "/atralectio/:path*",
    "/atradis/:path*",
    "/api/atra-optio-dashboard/:path*",
  ],
};
