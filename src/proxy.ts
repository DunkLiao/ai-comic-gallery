import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/env";

function verify(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(body)
    .digest()
    .toString("base64url");
  const ab = Buffer.from(sig);
  const bb = Buffer.from(expected);
  if (ab.length !== bb.length) return false;
  try {
    if (!timingSafeEqual(ab, bb)) return false;
  } catch {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      admin?: boolean;
      exp?: number;
    };
    return payload.admin === true && (payload.exp ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const signedIn = verify(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (!signedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/upload/:path*", "/api/themes/:path*"],
};