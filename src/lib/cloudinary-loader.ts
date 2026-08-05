"use client";

import { getCloudName } from "@/lib/env";

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const cloud = getCloudName();
  const params = ["f_auto", "a_exif", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`];
  return `https://res.cloudinary.com/${cloud}/image/upload/${params.join(",")}/${src}`;
}