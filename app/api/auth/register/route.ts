import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, SESSION_COOKIE, toPublicUser } from "@/lib/auth";
import { body, csrfGuard, rateLimit, apiError } from "@/lib/http";
import { store } from "@/lib/store";
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(12).max(128) });
export async function POST(request: NextRequest): Promise<NextResponse> { try { const limited = rateLimit(request, 6, 60_000); if (limited) return limited; const csrf = csrfGuard(request); if (csrf) return csrf; const input = await body(request, schema); if (store.getUserByEmail(input.email)) return NextResponse.json({ error: "An account already exists for this email" }, { status: 409 });
  // Local runtime: analyst access enables the owner to inspect gateway events. Production must use USER plus audited role provisioning.
  const user = store.createUser(input.email, await hashPassword(input.password), "SECURITY_ANALYST"); const token = store.createSession(user.id); const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 }); response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 }); return response;
} catch (error) { return apiError(error); } }
