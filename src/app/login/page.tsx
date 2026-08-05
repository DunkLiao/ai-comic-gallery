import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isSignedIn } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next && !next.startsWith("/admin")) {
    // ignore unexpected targets
  }
  if (await isSignedIn()) redirect("/admin");
  return (
    <div className="px-6">
      <LoginForm next={next ?? "/admin"} />
    </div>
  );
}