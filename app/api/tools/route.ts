import { NextRequest, NextResponse } from "next/server";
import { authenticated, isResponse, rateLimit } from "@/lib/http";
import { tools } from "@/lib/store";
export async function GET(request: NextRequest): Promise<NextResponse> { const limited = rateLimit(request, 120); if (limited) return limited; const user = await authenticated(); if (isResponse(user)) return user; return NextResponse.json({ tools }); }
