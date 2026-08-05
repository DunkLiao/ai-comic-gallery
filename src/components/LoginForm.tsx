"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "登入失敗");
        setLoading(false);
        return;
      }
      const target = next.startsWith("/admin") || next === "/" ? next : "/admin";
      router.replace(next === "/" ? "/admin" : target);
      router.refresh();
    } catch {
      setError("網路錯誤，請再試一次");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-16 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8"
    >
      <h1 className="text-center text-2xl font-semibold">管理員登入</h1>
      <p className="mt-2 text-center text-sm text-white/40">
        輸入帳號密碼以管理主題與上傳作品
      </p>

      <label className="mt-8 block text-xs uppercase tracking-wider text-white/45">
        帳號
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
          placeholder="admin"
        />
      </label>

      <label className="mt-5 block text-xs uppercase tracking-wider text-white/45">
        密碼
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-white py-2.5 font-medium text-black hover:bg-white/90 transition disabled:opacity-50"
      >
        {loading ? "登入中…" : "登入"}
      </button>
    </form>
  );
}