import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 漫畫藝廊",
  description: "一個沉浸式的線上漫畫藝廊，依主題策展呈現每一則視覺故事。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col vignette">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/5">
          <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-mono text-sm tracking-[0.2em] uppercase text-white/80 hover:text-white transition"
            >
              AI · Comic Gallery
            </Link>
            <Link
              href="/login"
              className="text-xs text-white/40 hover:text-white/70 transition"
            >
              管理員
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} AI Comic Gallery
        </footer>
      </body>
    </html>
  );
}