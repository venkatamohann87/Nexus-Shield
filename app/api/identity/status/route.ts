import { NextResponse } from "next/server";
import { authenticated, isResponse } from "@/lib/http";
import { store } from "@/lib/store";
export async function GET(): Promise<NextResponse> { const user = await authenticated(); if (isResponse(user)) return user; const credential = store.credentialFor(user.id); return NextResponse.json({ credential: credential ? { id: credential.id, status: credential.status, createdAt: credential.createdAt, verifiedAt: credential.verifiedAt } : null }); }
