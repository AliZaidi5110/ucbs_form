import path from "path";
import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PRESIGN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION || "ap-south-1";
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("Missing AWS_S3_BUCKET environment variable");
  return bucket;
}

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function uploadToS3(
  file: File,
  employeeId: string,
  documentType: string
): Promise<{ fileName: string; fileUrl: string; fileKey: string; mimeType: string }> {
  if (!isS3Configured()) {
    throw new Error("AWS S3 is not configured. Set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.");
  }

  const ext = path.extname(file.name) || ".bin";
  const fileKey = `onboarding/${employeeId}/${documentType}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getBucket();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      Metadata: {
        employeeId,
        documentType,
        originalName: file.name,
      },
    })
  );

  const fileUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: fileKey }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS }
  );

  return {
    fileName: file.name,
    fileUrl,
    fileKey,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function getS3SignedUrl(fileKey: string): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: fileKey }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS }
  );
}

export async function resolveUploadUrl(fileUrl: string, fileKey: string): Promise<string> {
  if (isS3Configured() && fileKey && !fileUrl.startsWith("http")) {
    return getS3SignedUrl(fileKey);
  }
  if (isS3Configured() && fileKey) {
    try {
      return await getS3SignedUrl(fileKey);
    } catch {
      return fileUrl;
    }
  }
  return fileUrl;
}
