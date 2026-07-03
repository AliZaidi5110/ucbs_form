import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createSignedToken } from "./rate-limit";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(
  file: File,
  employeeId: string,
  documentType: string
): Promise<{ fileName: string; fileUrl: string; fileKey: string; mimeType: string }> {
  await ensureUploadDir();

  const ext = path.extname(file.name) || ".bin";
  const fileKey = `${employeeId}/${documentType}/${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, fileKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  const signedToken = createSignedToken(fileKey, 86400 * 365);
  const fileUrl = `/api/files/${encodeURIComponent(fileKey)}?token=${signedToken}`;

  return {
    fileName: file.name,
    fileUrl,
    fileKey,
    mimeType: file.type,
  };
}

export async function getUploadedFile(fileKey: string): Promise<{
  buffer: Buffer;
  mimeType: string;
} | null> {
  const fullPath = path.join(UPLOAD_DIR, fileKey);
  try {
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fileKey).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    return { buffer, mimeType: mimeTypes[ext] || "application/octet-stream" };
  } catch {
    return null;
  }
}
