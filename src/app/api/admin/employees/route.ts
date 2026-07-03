import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listEmployees, createEmployeeRecord } from "@/lib/onboarding-service";
import { generateUcbsEmployeeId } from "@/lib/employee-id";
import { sendOnboardingLinkEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const employees = await listEmployees({
    search: searchParams.get("search") || "",
    department: searchParams.get("department") || "",
    status: searchParams.get("status") || "",
  });

  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    employeeId: inputEmployeeId,
    fullName,
    department,
    designation,
    reportingManager,
    dateOfJoining,
    workLocation,
    officialEmail,
    personalEmail,
    mobileNumber,
    sendEmail = true,
  } = body;

  if (!fullName || !department || !designation || !dateOfJoining || !workLocation) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const employeeId = inputEmployeeId?.trim() || (await generateUcbsEmployeeId());
  if (!/^UCBS-/i.test(employeeId)) {
    return NextResponse.json({ error: "Employee ID must start with UCBS-" }, { status: 400 });
  }

  if (officialEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(officialEmail))) {
    return NextResponse.json({ error: "Invalid official email format" }, { status: 400 });
  }

  const mobile = String(mobileNumber || "").trim();
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Valid 10-digit mobile number is required" }, { status: 400 });
  }

  try {
    const { employee, token } = await createEmployeeRecord({
      employeeId,
      fullName,
      department,
      designation,
      reportingManager,
      dateOfJoining,
      workLocation,
      officialEmail,
      personalEmail,
      mobileNumber: mobile,
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const onboardingUrl = `${appUrl}/onboard/${token}`;

    if (sendEmail) {
      await sendOnboardingLinkEmail({
        to: personalEmail || officialEmail || "onboarding@ucbs.com",
        employeeName: fullName,
        onboardingUrl,
      });
    }

    return NextResponse.json({ employee, token, onboardingUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create employee" },
      { status: 500 }
    );
  }
}
