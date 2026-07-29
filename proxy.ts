import { NextRequest, NextResponse } from "next/server";

const SHARED_PASSWORD_SHA256 = "abb721f3ae752177471316c0c51e1a0417fa38d880149f2979c5228add348df9";

function unauthorized(realm: string) {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function routeRealm(pathname: string) {
  return "Atra Vigil";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const realm = routeRealm(pathname);

  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Basic ")) {
    return unauthorized(realm);
  }

  let suppliedPassword = "";

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const splitAt = decoded.indexOf(":");
    suppliedPassword = splitAt >= 0 ? decoded.slice(splitAt + 1) : decoded;
  } catch {
    return unauthorized(realm);
  }

  const suppliedHash = await sha256Hex(suppliedPassword);

  if (!safeEqual(suppliedHash, SHARED_PASSWORD_SHA256)) {
    return unauthorized(realm);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
  ],
};
