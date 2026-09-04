import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processGatewayPrompt } from "@/lib/agent-gateway";
import { apiError, body, rateLimit } from "@/lib/http";

const schema = z.object({
  content: z.string().trim().min(1).max(12_000),
  attachment: z.object({ name: z.string().min(1).max(160), mimeType: z.string().min(1).max(100), base64: z.string().min(4).max(4_194_308) }).optional(),
  historyCount: z.number().int().min(0).max(100).default(0),
});

function allowedPhiOrigin(): string { return process.env.PHI_CLIENT_ORIGIN ?? "http://localhost:3001"; }

/** Public local Phi entrypoint. It is intentionally origin-bound and never bypasses HumanShield analysis. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const limited = rateLimit(request, 20); if (limited) return limited;
    if (request.headers.get("origin") !== allowedPhiOrigin()) return NextResponse.json({ error: "Anonymous Phi access is allowed only from the local Phi client." }, { status: 403 });
    const input = await body(request, schema);
    const result = await processGatewayPrompt(input, { userId: "anonymous", origin: "phi-local-client", kind: "anonymous" });
    // Anonymous callers receive the decision and risk level, never internal rule names or signal details.
    return NextResponse.json({ assessment: { riskScore: result.assessment.riskScore, riskLevel: result.assessment.riskLevel }, decision: result.decision, deliveredToLlm: result.deliveredToLlm, reply: result.reply, model: "model" in result ? result.model : undefined, message: result.message });
  } catch (error) { return apiError(error); }
}
