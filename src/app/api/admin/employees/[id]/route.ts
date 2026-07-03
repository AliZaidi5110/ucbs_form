import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getEmployeeWithDetails,
  loadFormDataForEmployee,
  reopenForEdits,
} from "@/lib/onboarding-service";
import { prisma } from "@/lib/prisma";
import { generateOnboardingPDF } from "@/lib/pdf";
import { getTokenExpiryDate } from "@/lib/rate-limit";
import { sendOnboardingLinkEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const employee = await getEmployeeWithDetails(id);
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await loadFormDataForEmployee(employee);

  if (req.nextUrl.searchParams.get("format") === "pdf") {
    const pdf = generateOnboardingPDF({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      submittedAt: employee.submittedAt,
      formData,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="onboarding-${employee.employeeId}.pdf"`,
      },
    });
  }

  return NextResponse.json({ employee, formData });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.action === "reopen") {
    await reopenForEdits(id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "resend-link") {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.onboardingToken.updateMany({
      where: { employeeId: id, isActive: true },
      data: { isActive: false },
    });

    const token = await prisma.onboardingToken.create({
      data: { employeeId: id, expiresAt: getTokenExpiryDate() },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const onboardingUrl = `${appUrl}/onboard/${token.token}`;
    await sendOnboardingLinkEmail({
      to: employee.personalEmail || employee.officialEmail,
      employeeName: employee.fullName,
      onboardingUrl,
    });

    return NextResponse.json({ onboardingUrl, token: token.token });
  }

  const { status, hrRemarks, officialEmail, inductionChecklist, itAssetAllocations } = body;

  const employeeUpdate: {
    status?: typeof status;
    hrRemarks?: string;
    officialEmail?: string | null;
  } = {};

  if (status) employeeUpdate.status = status;
  if (hrRemarks !== undefined) employeeUpdate.hrRemarks = hrRemarks;

  if (officialEmail !== undefined) {
    const email = String(officialEmail).trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid official email format" }, { status: 400 });
    }
    employeeUpdate.officialEmail = email || null;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (employee?.draftData && typeof employee.draftData === "object") {
      const draft = employee.draftData as Record<string, unknown>;
      const basic = (draft.basic as Record<string, unknown>) || {};
      await prisma.employee.update({
        where: { id },
        data: {
          draftData: {
            ...draft,
            basic: { ...basic, officialEmail: email },
          },
        },
      });
    }
  }

  if (Object.keys(employeeUpdate).length > 0) {
    await prisma.employee.update({
      where: { id },
      data: employeeUpdate,
    });
  }

  if (inductionChecklist) {
    await prisma.inductionChecklist.upsert({
      where: { employeeId: id },
      create: { employeeId: id, ...inductionChecklist },
      update: inductionChecklist,
    });
  }

  if (itAssetAllocations) {
    await prisma.iTAssetAllocation.deleteMany({ where: { employeeId: id } });
    if (itAssetAllocations.length) {
      await prisma.iTAssetAllocation.createMany({
        data: itAssetAllocations.map(
          (a: { asset: string; assetId: string; condition?: string; employeeAck?: boolean }, i: number) => ({
            employeeId: id,
            asset: a.asset,
            assetId: a.assetId,
            condition: a.condition || null,
            employeeAck: a.employeeAck || false,
            sortOrder: i,
          })
        ),
      });
    }
  }

  return NextResponse.json({ success: true });
}
