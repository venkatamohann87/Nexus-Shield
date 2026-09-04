import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, authenticated, body, csrfGuard, isResponse, rateLimit } from "@/lib/http";
import { humanCredentialProvider } from "@/lib/identity";
import { store } from "@/lib/store";
const schema = z.object({ proof: z.string().length(64), domain: z.string().min(3).max(180) });
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const user = await authenticated(); if (isResponse(user)) return user; const input = await body(request, schema); const credential = store.credentialFor(user.id); if (!credential) return NextResponse.json({ error: "Credential not found" }, { status: 404 }); return NextResponse.json({ valid: humanCredentialProvider.verifyProof(input.proof, credential, input.domain) }); } catch (error) { return apiError(error); } }
