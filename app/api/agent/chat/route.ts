import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processGatewayPrompt } from "@/lib/agent-gateway";
import { apiError, authenticated, body, csrfGuard, isResponse, rateLimit } from "@/lib/http";

const trust = z.enum(["SYSTEM", "DEVELOPER", "AUTHORIZED_USER", "APPLICATION", "TOOL", "RETRIEVED_DATA", "WEB_CONTENT", "EXTERNAL_AGENT", "UNTRUSTED"]);
const schema = z.object({
  content: z.string().trim().min(1).max(12_000),
  context: z.array(z.object({ content: z.string().min(1).max(12_000), source: z.string().min(1).max(80), trustLevel: trust, origin: z.string().max(160).default("external") })).max(10).default([]),
  historyCount: z.number().int().min(0).max(100).default(0),
});

/** Authenticated HumanShield workspace chat. The anonymous Phi client uses /api/public/phi-chat. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const limited = rateLimit(request, 20); if (limited) return limited;
    const csrf = csrfGuard(request); if (csrf) return csrf;
    const user = await authenticated(); if (isResponse(user)) return user;
    const input = await body(request, schema);
    return NextResponse.json(await processGatewayPrompt(input, { userId: user.id, origin: "human-shield-workspace", kind: "workspace" }));
  } catch (error) { return apiError(error); }
}
