import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";
import { LogoutButton } from "@/components/LogoutButton";
import { getThemeImages, getThemes } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const themes = await Promise.all(
    (await getThemes()).map(async (t) => ({
      slug: t.slug,
      title: t.title,
      count: (await getThemeImages(t.slug)).length,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3 text-xs text-white/40">
        <Link href="/admin" className="hover:text-white/70">
          ‹ 主題管理
        </Link>
        <span className="ml-auto">
          <LogoutButton />
        </span>
      </div>
      <UploadForm themes={themes} initialSlug={slug} />
    </div>
  );
}
