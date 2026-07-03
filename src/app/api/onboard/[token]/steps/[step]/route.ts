import { NextRequest, NextResponse } from "next/server";
import {
  getEmployeeByToken,
  saveStep,
  loadFormDataForEmployee,
} from "@/lib/onboarding-service";
import { stepSchemas } from "@/lib/validations/onboarding";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string; step: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { token, step: stepParam } = await params;
  const stepNumber = parseInt(stepParam, 10);

  if (Number.isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
    return NextResponse.json({ error: "Invalid step number" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`step:${ip}:${token}:${stepNumber}`, 60, 60_000);
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
  const stepData = body.stepData ?? body;
  const schema = stepSchemas[stepNumber as keyof typeof stepSchemas];

  if (!schema) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  const parsed = schema.safeParse(stepData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existingDraft =
    body.fullDraft ||
    (tokenRecord.employee.draftData as Awaited<ReturnType<typeof loadFormDataForEmployee>> | null) ||
    (await loadFormDataForEmployee(tokenRecord.employee));

  const merged = await saveStep(
    tokenRecord.employee.id,
    stepNumber,
    parsed.data,
    existingDraft
  );

  return NextResponse.json({ success: true, step: stepNumber, formData: merged });
}
