import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Atra Prae V2", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  const expectedUser = process.env.ATRA_PRAE_USER || "atra";
  const expectedPassword = process.env.ATRA_PRAE_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse("Atra Prae password is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const auth = request.headers.get("authorization");

  if (!auth || !auth.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(auth.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";

    if (user === expectedUser && password === expectedPassword) {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/atraprae/:path*"],
};
