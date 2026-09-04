import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { csrfGuard } from "@/lib/http";
import { store } from "@/lib/store";
export async function POST(request: NextRequest): Promise<NextResponse> { const csrf = csrfGuard(request); if (csrf) return csrf; const token = request.cookies.get(SESSION_COOKIE)?.value; if (token) store.deleteSession(token); const response = NextResponse.json({ ok: true }); response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 }); return response; }
