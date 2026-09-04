import { NextRequest, NextResponse } from "next/server";
import { authenticated, isResponse, rateLimit } from "@/lib/http";
import { store } from "@/lib/store";
export async function GET(request: NextRequest): Promise<NextResponse> { const limited = rateLimit(request, 120); if (limited) return limited; const user = await authenticated(); if (isResponse(user)) return user; if (!["SECURITY_ANALYST", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Approval access requires analyst authorization" }, { status: 403 }); return NextResponse.json({ approvals: store.approvals }); }
