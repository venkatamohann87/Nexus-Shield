import { NextRequest, NextResponse } from "next/server";
import { apiError, authenticated, csrfGuard, isResponse, rateLimit } from "@/lib/http";
import { humanCredentialProvider } from "@/lib/identity";
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const user = await authenticated(); if (isResponse(user)) return user; const credential = humanCredentialProvider.createCredential(user.id); return NextResponse.json({ credential: { id: credential.id, status: credential.status, createdAt: credential.createdAt } }, { status: 201 }); } catch (error) { return apiError(error); } }
