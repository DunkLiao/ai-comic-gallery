"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="text-xs text-white/40 hover:text-white/70 transition"
    >
      登出
    </button>
  );
}