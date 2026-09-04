import { NextRequest, NextResponse } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const phiClientPaths = new Set(["/api/public/phi-chat", "/api/public/phi-status"]);

function phiClientOrigin(): string { return process.env.PHI_CLIENT_ORIGIN ?? "http://localhost:3001"; }

function corsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Vary", "Origin");
  return headers;
}

/**
 * Defense in depth for API routes. Individual mutating routes also perform a
 * server-side origin check; keeping it here ensures newly added API endpoints
 * inherit the same baseline without relying on a frontend convention.
 */
export function middleware(request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const isPhiClient = origin === phiClientOrigin() && phiClientPaths.has(request.nextUrl.pathname);

  if (request.method === "OPTIONS" && isPhiClient) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (unsafeMethods.has(request.method) && origin && origin !== configuredOrigin && !isPhiClient) {
    return NextResponse.json(
      { error: "Cross-origin request rejected.", requestId },
      { status: 403, headers: { "Cache-Control": "no-store, max-age=0", "X-Request-Id": requestId } },
    );
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (isPhiClient) for (const [name, value] of corsHeaders(origin)) response.headers.set(name, value);
  return response;
}

export const config = { matcher: "/api/:path*" };
