import { uploadToSupabaseStorage } from "./supabase-storage";

export async function saveUploadedFile(
  file: File,
  employeeId: string,
  documentType: string
): Promise<{ fileName: string; fileUrl: string; fileKey: string; mimeType: string }> {
  return uploadToSupabaseStorage(file, employeeId, documentType);
}
