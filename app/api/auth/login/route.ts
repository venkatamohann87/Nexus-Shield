import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, toPublicUser, verifyPassword } from "@/lib/auth";
import { apiError, body, csrfGuard, rateLimit } from "@/lib/http";
import { store } from "@/lib/store";
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request, 8, 60_000); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const input = await body(request, schema); const user = store.getUserByEmail(input.email); if (!user || !(await verifyPassword(input.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 }); const token = store.createSession(user.id); const response = NextResponse.json({ user: toPublicUser(user) }); response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 }); return response;
} catch (error) { return apiError(error); } }
