import { getCloudName } from "@/lib/env";

export type ImgOpts = {
  width?: number;
  quality?: number;
  blur?: boolean;
  formatAuto?: boolean;
};

function buildTransform(opts: ImgOpts): string {
  const parts: string[] = [];
  if (opts.formatAuto !== false) parts.push("f_auto");
  parts.push("a_exif");
  parts.push("c_limit");
  if (opts.width) parts.push(`w_${opts.width}`);
  parts.push(`q_${opts.quality ?? "auto"}`);
  if (opts.blur) parts.push("e_blur:1200");
  return parts.join(",");
}

export function cdnUrl(publicId: string, opts: ImgOpts = {}): string {
  const cloud = getCloudName();
  return `https://res.cloudinary.com/${cloud}/image/upload/${buildTransform(opts)}/${publicId}`;
}

export function blurUrl(publicId: string): string {
  return cdnUrl(publicId, { width: 24, quality: 30, blur: true });
}