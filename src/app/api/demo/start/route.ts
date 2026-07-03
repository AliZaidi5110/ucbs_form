import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenExpiryDate } from "@/lib/rate-limit";

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

  const suffix = Date.now().toString(36).toUpperCase();
  const employeeId = `DEMO-${suffix}`;
  const slug = personalEmail.split("@")[0].replace(/[^a-z0-9]/gi, ".").slice(0, 20);
  const joinDate = new Date();
  joinDate.setDate(joinDate.getDate() + 7);

  const employee = await prisma.employee.create({
    data: {
      employeeId,
      fullName,
      department: "Information Technology",
      designation: "New Joinee",
      reportingManager: "HR Team",
      dateOfJoining: joinDate,
      workLocation: "Head Office",
      officialEmail: null,
      personalEmail,
      mobileNumber,
      status: "INVITED",
    },
  });

  const token = await prisma.onboardingToken.create({
    data: {
      employeeId: employee.id,
      expiresAt: getTokenExpiryDate(),
    },
  });

  return NextResponse.json({
    onboardingUrl: `/onboard/${token.token}`,
    employeeId,
  });
}
