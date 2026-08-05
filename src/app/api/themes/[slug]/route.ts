import { revalidatePath } from "next/cache";
import { deleteTheme, updateTheme } from "@/lib/gallery";
import { isSignedIn } from "@/lib/session";
import { slugify } from "@/lib/utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await isSignedIn())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  let body: {
    title?: string;
    description?: string;
    accentColor?: string;
    cover?: string | null;
    newSlug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "請求格式錯誤" }, { status: 400 });
  }

  const patch: {
    title?: string;
    description?: string;
    accentColor?: string;
    cover?: string | null;
    newSlug?: string;
  } = {};
  if (body.title !== undefined) patch.title = body.title.trim();
  if (body.description !== undefined) patch.description = body.description.trim();
  if (body.accentColor !== undefined)
    patch.accentColor = body.accentColor.trim() || "#7c5cff";
  if (body.cover !== undefined) patch.cover = body.cover;
  if (body.newSlug !== undefined && body.newSlug !== slug) {
    patch.newSlug = slugify(body.newSlug);
  }

  try {
    await updateTheme(slug, patch);
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "更新失敗" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await isSignedIn())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    await deleteTheme(slug);
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "刪除失敗" },
      { status: 400 },
    );
  }
}