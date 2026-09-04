import { NextRequest, NextResponse } from "next/server";
import { authenticated, isResponse, rateLimit } from "@/lib/http";
import { getLocalLlmStatus } from "@/lib/local-llm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimit(request, 30); if (limited) return limited;
  const user = await authenticated(); if (isResponse(user)) return user;
  return NextResponse.json({ localLlm: await getLocalLlmStatus() }, { headers: { "Cache-Control": "no-store" } });
}
