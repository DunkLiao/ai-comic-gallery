import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, requireEnv } from "@/lib/env";
import type { SessionPayload } from "@/lib/types";

function getSecret(): Buffer {
  return Buffer.from(requireEnv("SESSION_SECRET"), "utf8");
}

function b64url(input: Buffer | Uint8Array): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(payload: string): string {
  return b64url(createHmac("sha256", getSecret()).update(payload).digest());
}

function timingEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  const payload: SessionPayload = { admin: true, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${hmac(body)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  if (!timingEqual(hmac(body), sig)) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.admin === true && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}