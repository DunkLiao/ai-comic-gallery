import { revalidatePath } from "next/cache";
import { createTheme } from "@/lib/gallery";
import { isSignedIn } from "@/lib/session";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: {
    slug?: string;
    title?: string;
    description?: string;
    accentColor?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "請求格式錯誤" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return Response.json({ ok: false, error: "請輸入主題標題" }, { status: 400 });
  }
  const slug = slugify((body.slug ?? "").trim() || title);

  try {
    const theme = await createTheme({
      slug,
      title,
      description: (body.description ?? "").trim(),
      accentColor: (body.accentColor ?? "").trim() || "#7c5cff",
    });
    revalidatePath("/", "layout");
    return Response.json({ ok: true, theme });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "建立失敗" },
      { status: 400 },
    );
  }
}