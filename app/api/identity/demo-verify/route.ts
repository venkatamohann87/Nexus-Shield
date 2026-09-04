import { NextRequest, NextResponse } from "next/server";
import { apiError, authenticated, csrfGuard, isResponse, rateLimit } from "@/lib/http";
import { store } from "@/lib/store";
/** DEMO IMPLEMENTATION: simulates an issuer attesting a credential; no biometric or government ID data is requested. */
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request, 10); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const user = await authenticated(); if (isResponse(user)) return user; const credential = store.verifyCredential(user.id); return NextResponse.json({ credential: { id: credential.id, status: credential.status, verifiedAt: credential.verifiedAt } }); } catch (error) { return apiError(error); } }
