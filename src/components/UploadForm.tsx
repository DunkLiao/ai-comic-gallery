"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify, uniqueSlug } from "@/lib/utils";

type ThemeLite = { slug: string; title: string; count: number };
type Item = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
};

export function UploadForm({
  themes,
  initialSlug,
}: {
  themes: ThemeLite[];
  initialSlug?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [themeList, setThemeList] = useState<ThemeLite[]>(themes);
  const [slug, setSlug] = useState(
    initialSlug && themes.some((t) => t.slug === initialSlug)
      ? initialSlug
      : "",
  );
  const [creating, setCreating] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nSlug, setNSlug] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const uploadedInSession = useRef(0);

  const selected = themeList.find((t) => t.slug === slug) ?? null;

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    const newItems: Item[] = arr.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
      status: "pending",
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setDoneCount(0);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }
  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function ensureSlug(): Promise<string | null> {
    if (slug) return slug;
    if (!creating) {
      setErr("請選擇或建立一個主題");
      return null;
    }
    const title = nTitle.trim();
    if (!title) {
      setErr("請輸入新主題標題");
      return null;
    }
    const newSlug = uniqueSlug(
      slugify(nSlug.trim() || title),
      themeList.map((t) => t.slug),
    );
    const res = await fetch("/api/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newSlug, title, description: "" }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setErr(data.error ?? "建立主題失敗");
      return null;
    }
    const t: ThemeLite = {
      slug: data.theme.slug,
      title: data.theme.title,
      count: 0,
    };
    setThemeList((prev) => [t, ...prev]);
    setSlug(t.slug);
    setCreating(false);
    setNTitle("");
    setNSlug("");
    return t.slug;
  }

  function uploadXHR(url: string, formData: FormData, onProgress: (p: number) => void) {
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => resolve({ ok: xhr.status === 200 });
      xhr.onerror = () => resolve({ ok: false, error: "網路錯誤" });
      xhr.send(formData);
    });
  }

  async function startUpload() {
    setErr(null);
    const targetSlug = await ensureSlug();
    if (!targetSlug) return;
    const pending = items.filter((it) => it.status !== "done");
    if (pending.length === 0) {
      setErr("沒有可上傳的檔案");
      return;
    }
    setBusy(true);
    const ts = Date.now();
    let ok = 0;
    let fail = 0;
    const baseOrder =
      (selected?.count ?? 0) + uploadedInSession.current;

    // limited parallelism (3)
    const queue = [...pending];
    const workers = Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const it = queue.shift()!;
        const idxInBatch = items.indexOf(it);
        const order = baseOrder + idxInBatch;
        update(it.id, { status: "uploading", progress: 0 });
        const caption = it.caption
          .replace(/[|=]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 200);
        const context = `order=${order}|caption=${caption}`;
        const publicId = `comic-gallery/${targetSlug}/${ts}-${String(
          idxInBatch + 1,
        ).padStart(3, "0")}`;

        try {
          const sres = await fetch("/api/upload/signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicId,
              context,
              overwrite: false,
            }),
          });
          const s = await sres.json();
          if (!sres.ok || !s.ok) throw new Error(s.error ?? "簽章失敗");

          const fd = new FormData();
          fd.append("file", it.file);
          fd.append("signature", s.signature);
          fd.append("timestamp", String(s.timestamp));
          fd.append("api_key", s.apiKey);
          fd.append("public_id", s.publicId);
          fd.append("context", s.context);
          fd.append("overwrite", s.overwrite);

          const r = await uploadXHR(
            `https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`,
            fd,
            (p) => update(it.id, { progress: p }),
          );
          if (r.ok) {
            update(it.id, { status: "done", progress: 100 });
            ok += 1;
          } else {
            update(it.id, { status: "error" });
            fail += 1;
          }
        } catch {
          update(it.id, { status: "error" });
          fail += 1;
        }
      }
    });
    await Promise.all(workers);

    uploadedInSession.current += ok;
    setDoneCount(ok);
    setBusy(false);
    if (ok > 0) {
      await fetch("/api/revalidate", { method: "POST" });
      router.refresh();
    }
    if (fail > 0) setErr(`${fail} 張上傳失敗，請重試該張。`);
  }

  const allDone = items.length > 0 && items.every((it) => it.status === "done");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 text-xs text-white/40">
        <Link href="/admin" className="hover:text-white/70">
          ‹ 主題管理
        </Link>
        <span className="ml-auto font-mono">
          {items.length} 個檔案 · {items.filter((i) => i.status === "done").length} 已上傳
        </span>
      </div>

      <h1 className="text-3xl font-semibold">上傳作品</h1>

      {/* theme selector */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-white/45">
              主題
            </span>
            <select
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setCreating(false);
              }}
              className="mt-2 min-w-[14rem] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">— 選擇主題 —</option>
              {themeList.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}（{t.count} 頁）
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            {creating ? "取消建立" : "＋ 建立新主題"}
          </button>
        </div>

        {creating ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-white/45">
                新主題標題
              </span>
              <input
                value={nTitle}
                onChange={(e) => setNTitle(e.target.value)}
                placeholder="例如：機器人之夢"
                className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-white/45">
                Slug（可留空）
              </span>
              <input
                value={nSlug}
                onChange={(e) => setNSlug(e.target.value)}
                placeholder="robot-dreams"
                className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>

      {/* dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-6 cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-white/50 bg-white/10"
            : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-white/60">拖曳圖片到此，或點擊選擇檔案</p>
        <p className="mt-1 text-xs text-white/35">支援多選，可重複加入。順序可於下方調整。</p>
      </div>

      {/* list */}
      {items.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.previewUrl}
                alt=""
                className="h-20 w-20 flex-shrink-0 rounded object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span className="font-mono text-white/40">#{i + 1}</span>
                  <span className="truncate">{it.file.name}</span>
                </div>
                <input
                  value={it.caption}
                  onChange={(e) => update(it.id, { caption: e.target.value })}
                  placeholder="說明文字（可留空）"
                  disabled={it.status === "done"}
                  className="mt-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm placeholder-white/25 focus:border-white/30 focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => move(it.id, -1)}
                    disabled={i === 0 || busy}
                    className="rounded border border-white/15 px-2 py-0.5 hover:bg-white/5 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.id, 1)}
                    disabled={i === items.length - 1 || busy}
                    className="rounded border border-white/15 px-2 py-0.5 hover:bg-white/5 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    disabled={busy}
                    className="rounded border border-red-400/30 px-2 py-0.5 text-red-300 hover:bg-red-400/10 disabled:opacity-30"
                  >
                    移除
                  </button>
                  <span className="ml-auto">
                    {it.status === "uploading" ? (
                      <span className="text-white/50">{it.progress}%</span>
                    ) : it.status === "done" ? (
                      <span className="text-emerald-300">完成</span>
                    ) : it.status === "error" ? (
                      <span className="text-red-300">失敗</span>
                    ) : (
                      <span className="text-white/30">待上傳</span>
                    )}
                  </span>
                </div>
                {it.status === "uploading" ? (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded bg-white/10">
                    <div
                      className="h-full bg-white/70 transition-[width] duration-200"
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {err ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {err}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={busy || items.length === 0}
          onClick={startUpload}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90 transition disabled:opacity-50"
        >
          {busy ? "上傳中…" : "開始上傳"}
        </button>
        {allDone ? (
          <Link
            href={`/gallery/${slug}`}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"
            target="_blank"
          >
            前往展間觀看 →
          </Link>
        ) : null}
        {doneCount > 0 && !allDone ? (
          <span className="text-sm text-emerald-300">
            本輪已上傳 {doneCount} 張
          </span>
        ) : null}
      </div>
    </div>
  );
}