import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const isBlogSubdomain = host.startsWith("blog.");
  const { pathname } = request.nextUrl;

  // Already rewritten to /blog path - skip to prevent loops
  if (pathname.startsWith("/blog")) {
    return NextResponse.next();
  }

  if (isBlogSubdomain) {
    // Skip static files, api routes, and internal Next.js paths
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".") ||
      pathname === "/favicon.svg"
    ) {
      return NextResponse.next();
    }

    // Rewrite blog subdomain paths
    let newPathname: string;
    if (pathname === "/" || pathname === "") {
      newPathname = "/blog";
    } else {
      newPathname = `/blog${pathname}`;
    }

    const url = request.nextUrl.clone();
    url.pathname = newPathname;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
