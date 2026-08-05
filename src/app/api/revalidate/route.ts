import { revalidatePath } from "next/cache";
import { isSignedIn } from "@/lib/session";

export async function POST() {
  if (!(await isSignedIn())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}