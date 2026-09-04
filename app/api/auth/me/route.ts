import { NextResponse } from "next/server";
import { currentUser, toPublicUser } from "@/lib/auth";
export async function GET(): Promise<NextResponse> { const user = await currentUser(); return user ? NextResponse.json({ user: toPublicUser(user) }) : NextResponse.json({ user: null }); }
