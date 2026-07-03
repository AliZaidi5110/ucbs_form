import path from "path";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "onboarding-documents";
}

function normalizeFileKey(fileKey: string): string {
  return fileKey.startsWith("onboarding/") ? fileKey.slice("onboarding/".length) : fileKey;
}

export async function uploadToSupabaseStorage(
  file: File,
  employeeId: string,
  documentType: string
): Promise<{ fileName: string; fileUrl: string; fileKey: string; mimeType: string }> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const ext = path.extname(file.name) || ".bin";
  const fileKey = `${employeeId}/${documentType}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const { error } = await supabase.storage.from(bucket).upload(fileKey, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const fileUrl = await getStorageSignedUrl(fileKey);

  return {
    fileName: file.name,
    fileUrl,
    fileKey,
    mimeType,
  };
}

export async function getStorageSignedUrl(fileKey: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const normalizedKey = normalizeFileKey(fileKey);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedKey, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create signed URL");
  }

  return data.signedUrl;
}

export async function resolveUploadUrl(fileUrl: string, fileKey: string): Promise<string> {
  if (!fileKey) return fileUrl;
  try {
    return await getStorageSignedUrl(fileKey);
  } catch {
    return fileUrl;
  }
}

export async function deleteStorageFile(fileKey: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const { error } = await supabase.storage.from(bucket).remove([normalizeFileKey(fileKey)]);
  if (error) throw new Error(error.message);
}
