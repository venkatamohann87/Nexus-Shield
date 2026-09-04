import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
export const randomId = (bytes = 16): string => randomBytes(bytes).toString("hex");
export const redact = (text: string): string => text.replace(/(?:sk-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|(?:password|secret|token)\s*[:=]\s*\S+)/gi, "[REDACTED]");
export const equalHash = (a: string, b: string): boolean => {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
};
