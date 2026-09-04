import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { currentUser } from "@/lib/auth";
import type { User } from "@/lib/types";

const counters = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  // X-Forwarded-For is only meaningful when the reverse proxy is explicitly trusted.
  if (process.env.TRUST_PROXY === "true") return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "direct";
  return request.headers.get("x-real-ip") || "direct";
}
export function rateLimit(request: NextRequest, limit = 60, windowMs = 60_000): NextResponse | undefined {
  const key = clientKey(request); const now = Date.now();
  // Prevent stale in-process demo buckets from accumulating forever. Production uses a distributed limiter.
  if (counters.size > 5_000) for (const [bucket, entry] of counters) if (entry.resetAt <= now) counters.delete(bucket);
  const counter = counters.get(key);
  if (!counter || counter.resetAt < now) { counters.set(key, { count: 1, resetAt: now + windowMs }); return undefined; }
  counter.count += 1; if (counter.count > limit) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil((counter.resetAt - now) / 1000)) } });
  return undefined;
}
export function csrfGuard(request: NextRequest): NextResponse | undefined {
  const origin = request.headers.get("origin"); const host = request.headers.get("host");
  const phiClientOrigin = process.env.PHI_CLIENT_ORIGIN ?? "http://localhost:3001";
  if (origin && host && new URL(origin).host !== host && origin !== phiClientOrigin) return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  return undefined;
}
export async function body<T>(request: NextRequest, schema: ZodType<T>): Promise<T> { try { return schema.parse(await request.json()); } catch (error) { if (error instanceof ZodError) throw NextResponse.json({ error: "Invalid input", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 }); throw NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); } }
export async function authenticated(): Promise<User | NextResponse> { const user = await currentUser(); return user ?? NextResponse.json({ error: "Authentication required" }, { status: 401 }); }
export function isResponse(value: unknown): value is NextResponse { return value instanceof NextResponse; }
export function apiError(error: unknown): NextResponse { if (error instanceof NextResponse) return error; console.error(JSON.stringify({ level: "error", event: "api_error", message: error instanceof Error ? error.message : "unknown" })); return NextResponse.json({ error: "Request could not be processed" }, { status: 500 }); }
