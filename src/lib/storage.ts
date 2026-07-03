import { uploadToS3, isS3Configured } from "./s3";

export async function saveUploadedFile(
  file: File,
  employeeId: string,
  documentType: string
): Promise<{ fileName: string; fileUrl: string; fileKey: string; mimeType: string }> {
  if (!isS3Configured()) {
    throw new Error(
      "File storage is not configured. Set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in your environment."
    );
  }
  return uploadToS3(file, employeeId, documentType);
}
