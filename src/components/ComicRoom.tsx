"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { blurUrl, cdnUrl } from "@/lib/cdn";
import type { GalleryImage } from "@/lib/types";

export function ComicRoom({
  images,
  accent,
}: {
  images: GalleryImage[];
  accent: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keyboard nav in lightbox
  const close = useCallback(() => setOpenIndex(null), []);
  const go = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? i : Math.min(images.length - 1, Math.max(0, i + dir)),
      ),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, go]);

  const current = openIndex === null ? null : images[openIndex];

  return (
    <div ref={containerRef}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60 transition-opacity"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}22, transparent 55%)`,
        }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6 sm:space-y-10">
        {images.map((img, i) => (
          <figure
            key={img.publicId}
            className="reveal"
            style={{ "--reveal-delay": `${Math.min(i, 4) * 90}ms` } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block w-full overflow-hidden rounded-lg border border-white/10 bg-black/40"
              aria-label={`放大第 ${i + 1} 頁`}
            >
              <Image
                src={img.publicId}
                alt={img.caption ?? `第 ${i + 1} 頁`}
                width={img.width && img.height ? img.width : 1200}
                height={img.width && img.height ? img.height : 1600}
                sizes="(max-width: 768px) 100vw, 768px"
                placeholder="blur"
                blurDataURL={blurUrl(img.publicId)}
                className="w-full h-auto transition duration-700 group-hover:brightness-110"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-mono text-white/70 opacity-0 group-hover:opacity-100 transition">
                放大
              </div>
            </button>
            {img.caption ? (
              <figcaption className="mt-3 text-center text-sm text-white/55 italic">
                {img.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {current ? (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-5 py-4 text-white/70">
            <span className="font-mono text-xs">
              {openIndex! + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-3 py-1 text-sm hover:bg-white/10 transition"
              aria-label="關閉"
            >
              關閉 ✕
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-2 sm:px-12">
            {openIndex! > 0 ? (
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 transition h-11 w-11 grid place-items-center text-white"
                aria-label="上一頁"
              >
                ‹
              </button>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cdnUrl(current.publicId, { width: 1800 })}
              alt={current.caption ?? `第 ${openIndex! + 1} 頁`}
              className="max-h-full max-w-full object-contain"
            />
            {openIndex! < images.length - 1 ? (
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 transition h-11 w-11 grid place-items-center text-white"
                aria-label="下一頁"
              >
                ›
              </button>
            ) : null}
          </div>
          {current.caption ? (
            <p className="text-center text-sm text-white/60 italic py-4 px-6">
              {current.caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}