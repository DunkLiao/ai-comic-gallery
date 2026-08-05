import Link from "next/link";
import { ThemeCard } from "@/components/ThemeCard";
import { getThemeImages, getThemes } from "@/lib/gallery";

export const revalidate = 3600;

export default async function HomePage() {
  const themes = await getThemes();

  const cards = await Promise.all(
    themes.map(async (t) => ({
      theme: t,
      images: await getThemeImages(t.slug),
    })),
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <p className="font-mono text-xs tracking-[0.35em] uppercase text-white/40">
            Online Gallery
          </p>
          <h1 className="mt-6 text-5xl sm:text-7xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            AI 漫畫藝廊
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/50 leading-relaxed">
            每個主題是一座沉浸式展間。挑選一幅作品，走進一則由圖像訴說的故事。
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-16 text-center">
            <p className="text-white/60">尚未有任何主題展出。</p>
            <p className="mt-2 text-sm text-white/35">
              身為管理員，可先
              <Link href="/login" className="underline underline-offset-4 hover:text-white">
                登入
              </Link>
              後上傳第一組作品。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(({ theme, images }) => (
              <ThemeCard
                key={theme.slug}
                theme={theme}
                count={images.length}
                firstImage={images[0]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}