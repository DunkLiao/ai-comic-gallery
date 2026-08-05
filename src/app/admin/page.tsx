import Link from "next/link";
import { AdminThemes } from "@/components/AdminThemes";
import { LogoutButton } from "@/components/LogoutButton";
import { getThemeImages, getThemes } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const themes = await getThemes();
  const withImages = await Promise.all(
    themes.map(async (t) => {
      const imgs = await getThemeImages(t.slug);
      return {
        theme: t,
        count: imgs.length,
        images: imgs.map((i) => i.publicId),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3 text-xs text-white/40">
        <Link href="/" className="hover:text-white/70">
          ‹ 回前台
        </Link>
        <span>·</span>
        <Link href="/admin/upload" className="hover:text-white/70">
          上傳頁
        </Link>
        <span className="ml-auto">
          <LogoutButton />
        </span>
      </div>
      <AdminThemes initial={withImages} />
    </div>
  );
}