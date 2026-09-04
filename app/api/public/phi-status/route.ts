import { NextRequest, NextResponse } from "next/server";
import { getLocalLlmStatus } from "@/lib/local-llm";
import { rateLimit } from "@/lib/http";

function allowedPhiOrigin(): string { return process.env.PHI_CLIENT_ORIGIN ?? "http://localhost:3001"; }

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimit(request, 60); if (limited) return limited;
  if (request.headers.get("origin") !== allowedPhiOrigin()) return NextResponse.json({ error: "Status is available only to the local Phi client." }, { status: 403 });
  return NextResponse.json({ localLlm: await getLocalLlmStatus() }, { headers: { "Cache-Control": "no-store" } });
}
