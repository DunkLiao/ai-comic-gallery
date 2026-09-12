import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { setSessionCookie } from "@/lib/session";
import { requireEnv } from "@/lib/env";

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry) {
    if (now - entry.first > WINDOW_MS) attempts.delete(ip);
    else if (entry.count >= MAX_ATTEMPTS) {
      return Response.json(
        { ok: false, error: "嘗試次數過多，請稍後再試。" },
        { status: 429 },
      );
    }
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "請求格式錯誤" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const okUser = username === requireEnv("ADMIN_USERNAME");
  const okPass = bcrypt.compareSync(password, requireEnv("ADMIN_PASSWORD_HASH"));

  if (!okUser || !okPass) {
    const e = attempts.get(ip) ?? { count: 0, first: now };
    e.count += 1;
    if (now - e.first > WINDOW_MS) {
      e.count = 1;
      e.first = now;
    }
    attempts.set(ip, e);

    // rough delay to mitigate brute force
    await new Promise((r) => setTimeout(r, 400));
    return Response.json(
      { ok: false, error: "帳號或密碼不正確" },
      { status: 401 },
    );
  }

  attempts.delete(ip);
  await setSessionCookie();
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
