import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByToken } from "@/lib/onboarding-service";
import { rateLimit } from "@/lib/rate-limit";
import { saveUploadedFile } from "@/lib/storage";
import {
  DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPE_KEYS,
  type DocumentTypeKey,
} from "@/lib/constants";

type Params = { params: Promise<{ token: string }> };

function resolveMimeType(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return ext ? map[ext] || "application/octet-stream" : "application/octet-stream";
}

function isAllowedMime(documentType: DocumentTypeKey, mimeType: string): boolean {
  const allowed = DOCUMENT_MIME_TYPES[documentType];
  if (!allowed) return true;
  return allowed.includes(mimeType);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`upload:${ip}:${token}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const tokenRecord = await getEmployeeByToken(token);
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (
    tokenRecord.employee.status === "SUBMITTED" ||
    tokenRecord.employee.status === "VERIFIED"
  ) {
    return NextResponse.json({ error: "Form is read-only" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentTypeRaw = String(formData.get("documentType") || "").trim();

    if (!file || !documentTypeRaw) {
      return NextResponse.json({ error: "File and documentType are required" }, { status: 400 });
    }

    if (!DOCUMENT_TYPE_KEYS.includes(documentTypeRaw as DocumentTypeKey)) {
      return NextResponse.json(
        { error: `Invalid documentType. Allowed: ${DOCUMENT_TYPE_KEYS.join(", ")}` },
        { status: 400 }
      );
    }

    const documentType = documentTypeRaw as DocumentTypeKey;

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const mimeType = resolveMimeType(file);
    if (!isAllowedMime(documentType, mimeType)) {
      const allowed = DOCUMENT_MIME_TYPES[documentType]?.join(", ") || "supported types";
      return NextResponse.json(
        { error: `Invalid file type for ${documentType}. Allowed: ${allowed}` },
        { status: 400 }
      );
    }

    const uploaded = await saveUploadedFile(file, tokenRecord.employee.id, documentType);

    return NextResponse.json({
      documentType,
      fileName: uploaded.fileName,
      fileUrl: uploaded.fileUrl,
      fileKey: uploaded.fileKey,
      mimeType: uploaded.mimeType || mimeType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[upload]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
