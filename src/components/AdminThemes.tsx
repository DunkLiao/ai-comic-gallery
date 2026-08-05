"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify, formatDate, uniqueSlug } from "@/lib/utils";
import type { Theme } from "@/lib/types";

type ThemeWithImages = { theme: Theme; count: number; images: string[] };

export function AdminThemes({ initial }: { initial: ThemeWithImages[] }) {
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeWithImages[]>(initial);

  // New theme form
  const [creating, setCreating] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nSlug, setNSlug] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nColor, setNColor] = useState("#7c5cff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Edit state
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eSlug, setESlug] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eColor, setEColor] = useState("#7c5cff");
  const [eCover, setECover] = useState<string>("");

  function startEdit(t: ThemeWithImages) {
    setEditSlug(t.theme.slug);
    setETitle(t.theme.title);
    setESlug(t.theme.slug);
    setEDesc(t.theme.description);
    setEColor(t.theme.accentColor);
    setECover(t.theme.cover ?? t.images[0] ?? "");
    setErr(null);
  }
  function cancelEdit() {
    setEditSlug(null);
    setErr(null);
  }

  async function api(url: string, init: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error ?? "操作失敗");
    return data;
  }

  async function createTheme() {
    setErr(null);
    const title = nTitle.trim();
    if (!title) return setErr("請輸入標題");
    setBusy(true);
    try {
      const slug = uniqueSlug(
        slugify(nSlug.trim() || title),
        themes.map((t) => t.theme.slug),
      );
      const data = await api("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description: nDesc.trim(),
          accentColor: nColor,
        }),
      });
      setThemes([
        { theme: data.theme, count: 0, images: [] },
        ...themes,
      ]);
      setNTitle("");
      setNSlug("");
      setNDesc("");
      setNColor("#7c5cff");
      setCreating(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(slug: string) {
    setErr(null);
    setBusy(true);
    try {
      await api(`/api/themes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eTitle.trim(),
          newSlug: eSlug.trim(),
          description: eDesc.trim(),
          accentColor: eColor,
          cover: eCover || null,
        }),
      });
      setThemes((prev) =>
        prev.map((t) =>
          t.theme.slug === slug
            ? {
                theme: {
                  ...t.theme,
                  title: eTitle.trim(),
                  slug: eSlug.trim(),
                  description: eDesc.trim(),
                  accentColor: eColor,
                  cover: eCover || null,
                },
                count: t.count,
                images: t.images,
              }
            : t,
        ),
      );
      setEditSlug(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setBusy(false);
    }
  }

  async function removeTheme(slug: string, title: string) {
    if (!confirm(`確定刪除主題「${title}」？其下所有圖片將一併從 Cloudinary 移除。`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/themes/${slug}`, { method: "DELETE" });
      setThemes((prev) => prev.filter((t) => t.theme.slug !== slug));
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">主題管理</h1>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition"
        >
          {creating ? "取消" : "＋ 新增主題"}
        </button>
      </div>

      {err ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {err}
        </p>
      ) : null}

      {creating ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <Field label="主題標題">
            <input
              value={nTitle}
              onChange={(e) => setNTitle(e.target.value)}
              className={inputCls}
              placeholder="例如：午夜城市"
            />
          </Field>
          <Field label="Slug（網址用，可留空自動產生）">
            <input
              value={nSlug}
              onChange={(e) => setNSlug(e.target.value)}
              className={inputCls}
              placeholder="midnight-city"
            />
          </Field>
          <Field label="簡介">
            <textarea
              value={nDesc}
              onChange={(e) => setNDesc(e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="這個主題的故事是⋯"
            />
          </Field>
          <Field label="展間氛圍色">
            <input
              type="color"
              value={nColor}
              onChange={(e) => setNColor(e.target.value)}
              className="h-10 w-16 rounded border border-white/15 bg-black/40"
            />
          </Field>
          <button
            type="button"
            disabled={busy}
            onClick={createTheme}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition disabled:opacity-50"
          >
            建立
          </button>
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {themes.length === 0 ? (
          <p className="text-white/45">尚未建立主題。點上方「新增主題」開始。</p>
        ) : (
          themes.map(({ theme, count, images }) => (
            <div
              key={theme.slug}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              {editSlug === theme.slug ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="標題">
                      <input
                        value={eTitle}
                        onChange={(e) => setETitle(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Slug">
                      <input
                        value={eSlug}
                        onChange={(e) => setESlug(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="簡介">
                    <textarea
                      value={eDesc}
                      onChange={(e) => setEDesc(e.target.value)}
                      rows={2}
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="氛圍色">
                      <input
                        type="color"
                        value={eColor}
                        onChange={(e) => setEColor(e.target.value)}
                        className="h-10 w-16 rounded border border-white/15 bg-black/40"
                      />
                    </Field>
                    <Field label="封面（從作品挑選）">
                      <select
                        value={eCover}
                        onChange={(e) => setECover(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">（使用第一張）</option>
                        {images.map((id, i) => (
                          <option key={id} value={id}>
                            第 {i + 1} 頁
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveEdit(theme.slug)}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: theme.accentColor }}
                  />
                  <div className="flex-1 min-w-[12rem]">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{theme.title}</h3>
                      <span className="font-mono text-xs text-white/40">
                        /{theme.slug}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/45 line-clamp-1">
                      {theme.description || "（無簡介）"} · {count} 頁 ·{" "}
                      {formatDate(theme.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link
                      href={`/gallery/${theme.slug}`}
                      className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/5"
                      target="_blank"
                    >
                      查看
                    </Link>
                    <Link
                      href={`/admin/upload?slug=${theme.slug}`}
                      className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20"
                    >
                      上傳作品
                    </Link>
                    <button
                      type="button"
                      onClick={() => startEdit({ theme, count, images })}
                      className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/5"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeTheme(theme.slug, theme.title)}
                      className="rounded-lg border border-red-400/30 px-3 py-1.5 text-red-300 hover:bg-red-400/10"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-white/45">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}