import { NextResponse } from "next/server";

/** Public, non-sensitive liveness endpoint for local containers and deployment platforms. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    service: "humanshield-ai",
    mode: "local-security-runtime",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
