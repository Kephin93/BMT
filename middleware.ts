import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privateRoutes = [{ regex: /^\/admin(\/.*)?$/i }];
const skipPaths = ["/undefined/"];

function getOrigin(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;

  return `${proto}://${host}`;
}

function buildLoginUrl(request: NextRequest): URL {
  const origin = getOrigin(request);
  const loginUrl = new URL("/login", origin);

  const fullPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("redirect", new URL(fullPath, origin).toString());

  return loginUrl;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname } = url;

  if (skipPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // avoid accidental loops
  if (pathname === "/login") return NextResponse.next();

  const lowerPath = pathname.toLowerCase();
  if (pathname !== lowerPath) {
    const redirectURL = url.clone();
    redirectURL.pathname = lowerPath;
    return NextResponse.redirect(redirectURL, 308);
  }

  const isPrivate = privateRoutes.some(({ regex }) => regex.test(pathname));
  if (isPrivate) {
    const sessionUserCookie = request.cookies.get("BMT_COOKIE");
    const sessionActive = !!sessionUserCookie?.value;

    if (!sessionActive) {
      const loginUrl = buildLoginUrl(request);
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
