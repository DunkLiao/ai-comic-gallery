import Image from "next/image";
import Link from "next/link";
import { blurUrl } from "@/lib/cdn";
import type { GalleryImage, Theme } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ThemeCard({
  theme,
  count,
  firstImage,
}: {
  theme: Theme;
  count: number;
  firstImage?: GalleryImage;
}) {
  const cover = theme.cover || firstImage?.publicId;
  const accent = theme.accentColor || "#7c5cff";

  return (
    <Link
      href={`/gallery/${theme.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] aspect-[4/5]"
      style={{ boxShadow: `0 0 0 0 ${accent}00` }}
    >
      {cover ? (
        <Image
          src={cover}
          alt={theme.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={blurUrl(cover)}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/20 text-sm">
          尚未上傳作品
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div
        className="absolute inset-x-0 bottom-0 h-1 opacity-70 group-hover:opacity-100 transition"
        style={{ background: accent }}
      />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-white drop-shadow">
            {theme.title}
          </h2>
          <span className="font-mono text-[11px] text-white/50">
            {count} 頁
          </span>
        </div>
        {theme.description ? (
          <p className="mt-1.5 text-sm text-white/60 line-clamp-2">
            {theme.description}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-white/40">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: accent }}
          />
          <span>{formatDate(theme.createdAt)}</span>
          <span className="ml-auto translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
            進入展間 →
          </span>
        </div>
      </div>
    </Link>
  );
}