import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, authenticated, body, csrfGuard, isResponse, rateLimit } from "@/lib/http";
import { humanCredentialProvider } from "@/lib/identity";
import { store } from "@/lib/store";
const schema = z.object({ domain: z.string().min(3).max(180).regex(/^[a-z0-9.-]+$/i) });
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const user = await authenticated(); if (isResponse(user)) return user; const input = await body(request, schema); const credential = store.credentialFor(user.id); if (!credential || credential.status !== "VERIFIED") return NextResponse.json({ error: "Verify a demo human credential before creating a proof" }, { status: 409 }); return NextResponse.json({ proof: humanCredentialProvider.generateProof(credential, input.domain), domain: input.domain }); } catch (error) { return apiError(error); } }
