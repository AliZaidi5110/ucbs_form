import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByToken } from "@/lib/onboarding-service";
import { rateLimit } from "@/lib/rate-limit";
import { saveUploadedFile } from "@/lib/storage";

type Params = { params: Promise<{ token: string }> };

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const documentType = formData.get("documentType") as string | null;

  if (!file || !documentType) {
    return NextResponse.json({ error: "File and documentType required" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const uploaded = await saveUploadedFile(file, tokenRecord.employee.id, documentType);
  return NextResponse.json(uploaded);
}
