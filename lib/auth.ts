import bcrypt from "bcryptjs";
import crypto from "crypto";
import "server-only";
import { serverConfig } from "@/config/server";

const AUTH_SECRET = serverConfig.authSecret!;
if (!AUTH_SECRET) throw new Error("Missing AUTH_SECRET env var");

export async function hashPassword(password: string) {
  // 10-12 is typical. 10 is fine for most apps.
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Lightweight signed session token (HMAC).
 * If you prefer JWT, we can swap this to jose later.
 */
export function signSession(payload: object) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(b64)
    .digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySession(token: string) {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const expected = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(b64)
    .digest("base64url");

  // timing-safe compare
  const ok =
    expected.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));

  if (!ok) return null;

  const json = Buffer.from(b64, "base64url").toString("utf8");
  return JSON.parse(json) as any;
}
