import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByToken, saveDraft } from "@/lib/onboarding-service";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`draft:${ip}:${token}`, 120, 60_000);
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

  const body = await req.json();
  await saveDraft(tokenRecord.employee.id, body);
  return NextResponse.json({ success: true });
}
