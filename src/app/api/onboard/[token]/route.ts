import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByToken, loadFormDataForEmployee } from "@/lib/onboarding-service";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`onboard:${ip}:${token}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const tokenRecord = await getEmployeeByToken(token);
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  const readOnly =
    tokenRecord.employee.status === "SUBMITTED" ||
    tokenRecord.employee.status === "VERIFIED";

  const formData = await loadFormDataForEmployee(tokenRecord.employee);

  return NextResponse.json({
    employee: {
      id: tokenRecord.employee.id,
      fullName: tokenRecord.employee.fullName,
      status: tokenRecord.employee.status,
    },
    formData,
    readOnly,
  });
}
