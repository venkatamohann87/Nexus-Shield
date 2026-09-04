import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import type { PublicUser, User } from "@/lib/types";

export const SESSION_COOKIE = "humanshield_session";
export const toPublicUser = (user: User): PublicUser => ({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);
export async function currentUser(): Promise<User | undefined> { const token = (await cookies()).get(SESSION_COOKIE)?.value; return token ? store.getSession(token) : undefined; }
export async function requireUser(): Promise<User> { const user = await currentUser(); if (!user) throw new Error("UNAUTHORIZED"); return user; }
export function roleAtLeast(user: User, allowed: User["role"][]): boolean { return allowed.includes(user.role); }
