import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, authenticated, body, csrfGuard, isResponse, rateLimit } from "@/lib/http";
import { makeContext, riskEngine } from "@/lib/risk-engine";
import { authorizeTool, recordToolEvent } from "@/lib/tool-gateway";
const schema = z.object({ toolName: z.string().min(2).max(80), reason: z.string().min(3).max(1500), origin: z.string().max(160).default("agent-playground"), content: z.string().max(12000).optional() });
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const user = await authenticated(); if (isResponse(user)) return user; const input = await body(request, schema); const origin = input.origin ?? "agent-playground"; const assessment = riskEngine.analyzeRequest([makeContext(input.content ?? input.reason, "TOOL_REQUEST", "AUTHORIZED_USER", origin)]); const result = authorizeTool(user.id, user.role, input.toolName, input.reason, assessment, origin); recordToolEvent(user.id, result, assessment, origin); return NextResponse.json({ ...result, assessment }); } catch (error) { return apiError(error); } }
