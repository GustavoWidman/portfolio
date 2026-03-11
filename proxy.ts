import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCurlResponse } from "@/lib/curl-response";
import { getLanguage } from "@/lib/language-server";

const CURL_PATTERN = /^curl\//;

export function proxy(request: NextRequest): NextResponse {
  const userAgent = request.headers.get("user-agent") || "";

  if (CURL_PATTERN.test(userAgent)) {
    const lang = getLanguage(request.cookies, request.headers);
    const response = buildCurlResponse(lang);

    return new NextResponse(response, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/index"],
};
