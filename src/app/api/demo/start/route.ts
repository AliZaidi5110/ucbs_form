import { NextResponse } from "next/server";
import { generateUcbsEmployeeId } from "@/lib/employee-id";
import { createEmployeeRecord } from "@/lib/onboarding-service";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_ONBOARDING !== "true") {
    return NextResponse.json({ error: "Demo onboarding is disabled in production" }, { status: 403 });
  }

  const body = await req.json();
  const fullName = String(body.fullName || "").trim();
  const personalEmail = String(body.personalEmail || "").trim().toLowerCase();
  const mobileNumber = String(body.mobileNumber || "").trim();

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
  }

  if (!personalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
  }

  try {
    const employeeId = await generateUcbsEmployeeId();
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() + 7);

    const { employee, token } = await createEmployeeRecord({
      employeeId,
      fullName,
      department: "Information Technology",
      designation: "New Joinee",
      reportingManager: "HR Team",
      dateOfJoining: joinDate.toISOString().split("T")[0],
      workLocation: "Head Office",
      personalEmail,
      mobileNumber,
    });

    return NextResponse.json({
      onboardingUrl: `/onboard/${token}`,
      employeeId: employee.employeeId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start onboarding" },
      { status: 500 }
    );
  }
}
