import { getCloudinary } from "@/lib/cloudinary";
import { getCloudName } from "@/lib/env";
import { isSignedIn } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: {
    publicId?: string;
    context?: string;
    overwrite?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "請求格式錯誤" }, { status: 400 });
  }

  const publicId = (body.publicId ?? "").trim();
  if (!publicId.startsWith("comic-gallery/")) {
    return Response.json({ ok: false, error: "public_id 不合法" }, { status: 400 });
  }

  const c = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string> = {
    timestamp: String(timestamp),
    public_id: publicId,
    overwrite: body.overwrite ? "true" : "false",
  };
  if (body.context) paramsToSign.context = body.context;

  const signature = c.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return Response.json({
    ok: true,
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: getCloudName(),
    publicId,
    overwrite: body.overwrite ? "true" : "false",
    context: body.context ?? "",
  });
}