import "server-only";
import { getCloudinary } from "@/lib/cloudinary";
import { hasCloudinaryConfig } from "@/lib/env";
import type { GalleryImage, Theme, ThemesFile } from "@/lib/types";

export const THEME_FOLDER = "comic-gallery";
export const THEMES_PUBLIC_ID = "comic-gallery/themes";

type RawResource = {
  public_id: string;
  width?: number;
  height?: number;
  context?: { custom?: Record<string, string> };
};

function sortImages(resources: RawResource[]): GalleryImage[] {
  return resources
    .map((r) => {
      const ctx = r.context?.custom ?? {};
      const order = Number(ctx.order);
      return {
        publicId: r.public_id,
        caption: (ctx.caption as string | undefined) ?? null,
        order: Number.isFinite(order) ? order : 0,
        width: r.width ?? null,
        height: r.height ?? null,
      } satisfies GalleryImage;
    })
    .sort((a, b) => a.order - b.order || a.publicId.localeCompare(b.publicId));
}

export async function getThemes(): Promise<Theme[]> {
  if (!hasCloudinaryConfig()) return [];
  const c = getCloudinary();
  try {
    const res = (await c.api.resource(THEMES_PUBLIC_ID, {
      resource_type: "raw",
    })) as { secure_url: string };
    const r = await fetch(`${res.secure_url}?_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!r.ok) return [];
    const data = (await r.json()) as ThemesFile;
    return (data.themes ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function getTheme(slug: string): Promise<Theme | undefined> {
  return (await getThemes()).find((t) => t.slug === slug);
}

export async function getThemeImages(slug: string): Promise<GalleryImage[]> {
  if (!hasCloudinaryConfig()) return [];
  const c = getCloudinary();
  try {
    const res = (await c.search
      .expression(`folder:${THEME_FOLDER}/${slug}`)
      .with_field("context")
      .max_results(500)
      .execute()) as { resources: RawResource[] };
    return sortImages(res.resources ?? []);
  } catch {
    return [];
  }
}

export async function saveThemes(themes: Theme[]): Promise<void> {
  const c = getCloudinary();
  const json = JSON.stringify({ themes });
  const dataUri = `data:application/json;base64,${Buffer.from(json, "utf8").toString("base64")}`;
  await c.uploader.upload(dataUri, {
    public_id: THEMES_PUBLIC_ID,
    resource_type: "raw",
    overwrite: true,
    invalidate: true,
  });
}

export async function createTheme(
  input: Omit<Theme, "createdAt" | "cover"> & { cover?: string | null },
): Promise<Theme> {
  const themes = await getThemes();
  const theme: Theme = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    cover: input.cover ?? null,
    accentColor: input.accentColor || "#7c5cff",
    createdAt: new Date().toISOString(),
  };
  if (themes.some((t) => t.slug === theme.slug)) {
    throw new Error(`主題 "${theme.slug}" 已存在`);
  }
  await saveThemes([theme, ...themes]);
  return theme;
}

export async function updateTheme(
  slug: string,
  patch: Partial<Omit<Theme, "slug" | "createdAt">> & { newSlug?: string },
): Promise<void> {
  const themes = await getThemes();
  const idx = themes.findIndex((t) => t.slug === slug);
  if (idx === -1) throw new Error(`主題 "${slug}" 不存在`);

  if (patch.cover === "") patch.cover = null;

  const { newSlug, ...rest } = patch;
  if (newSlug && newSlug !== slug) {
    if (themes.some((t) => t.slug === newSlug)) {
      throw new Error(`主題 "${newSlug}" 已存在`);
    }
    themes[idx] = { ...themes[idx], ...rest, slug: newSlug };
  } else {
    themes[idx] = { ...themes[idx], ...rest };
  }
  await saveThemes(themes);
}

export async function deleteTheme(slug: string): Promise<void> {
  const c = getCloudinary();
  try {
    await c.api.delete_resources_by_prefix(`${THEME_FOLDER}/${slug}/`);
  } catch {
    // ignore resource errors
  }
  const themes = (await getThemes()).filter((t) => t.slug !== slug);
  await saveThemes(themes);
}