import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByToken, submitOnboarding } from "@/lib/onboarding-service";
import { onboardingFormSchema } from "@/lib/validations/onboarding";
import { rateLimit } from "@/lib/rate-limit";
import { sendSubmissionConfirmationEmail } from "@/lib/email";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`submit:${ip}:${token}`, 10, 60_000);
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
  const parsed = onboardingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await submitOnboarding(tokenRecord.employee.id, parsed.data);

  const email = parsed.data.basic.personalEmail || tokenRecord.employee.officialEmail || tokenRecord.employee.personalEmail;
  if (email) {
    await sendSubmissionConfirmationEmail({
      to: email,
      employeeName: parsed.data.basic.fullName,
    });
  }

  return NextResponse.json({ success: true });
}
