import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicRoom } from "@/components/ComicRoom";
import { cdnUrl } from "@/lib/cdn";
import { getTheme, getThemeImages } from "@/lib/gallery";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = await getTheme(slug);
  if (!theme) return { title: "找不到主題" };

  return {
    title: `${theme.title} · AI 漫畫藝廊`,
    description: theme.description || `欣賞 ${theme.title} 主題的漫畫作品。`,
    openGraph: theme.cover
      ? { images: [{ url: cdnUrl(theme.cover, { width: 1200 }) }] }
      : undefined,
  };
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = await getTheme(slug);
  if (!theme) notFound();
  const images = await getThemeImages(slug);
  const accent = theme.accentColor || "#7c5cff";

  return (
    <article className="pt-12 pb-28">
      <header className="mx-auto max-w-3xl px-6 text-center">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition"
        >
          ‹ 所有展間
        </Link>
        <div
          className="mx-auto mt-6 h-px w-24"
          style={{ background: accent }}
        />
        <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight">
          {theme.title}
        </h1>
        {theme.description ? (
          <p className="mx-auto mt-4 max-w-xl text-white/55 leading-relaxed">
            {theme.description}
          </p>
        ) : null}
        <p className="mt-4 font-mono text-xs text-white/40">
          {formatDate(theme.createdAt)} · {images.length} 頁
        </p>
      </header>

      <div className="mt-16">
        {images.length === 0 ? (
          <p className="text-center text-white/45">這個展間尚未上傳作品。</p>
        ) : (
          <ComicRoom images={images} accent={accent} />
        )}
      </div>
    </article>
  );
}