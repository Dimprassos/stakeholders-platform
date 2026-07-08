import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Saves an uploaded image under public/uploads/<subdir>/ and returns its public
 * URL. Dev-only: production rejects direct file uploads until object storage is
 * connected (see docs/RELEASE.md) — callers must gate on NODE_ENV themselves.
 */
export async function saveUploadedImage(
  file: File,
  subdir: string,
  idHint: string,
): Promise<string> {
  const ext = ALLOWED_IMAGE_EXT[file.type];
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const safeId = idHint.replace(/[^a-zA-Z0-9_-]/g, "") || subdir;
  const filename = `${safeId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${subdir}/${filename}`;
}
