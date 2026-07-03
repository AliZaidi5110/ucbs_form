import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTokenExpiryDate } from "@/lib/rate-limit";
import { sendOnboardingLinkEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const status = searchParams.get("status") || "";

  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { employeeId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        department ? { department } : {},
        status ? { status: status as "INVITED" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED" } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      tokens: { where: { isActive: true }, take: 1 },
    },
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
    employeeId,
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

  if (!employeeId || !fullName || !department || !designation || !dateOfJoining || !workLocation) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (officialEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(officialEmail))) {
    return NextResponse.json({ error: "Invalid official email format" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: {
      employeeId,
      fullName,
      department,
      designation,
      reportingManager: reportingManager || null,
      dateOfJoining: new Date(dateOfJoining),
      workLocation,
      officialEmail: officialEmail ? String(officialEmail).toLowerCase() : null,
      personalEmail: personalEmail || null,
      mobileNumber: mobileNumber || null,
      status: "INVITED",
    },
  });

  const token = await prisma.onboardingToken.create({
    data: {
      employeeId: employee.id,
      expiresAt: getTokenExpiryDate(),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const onboardingUrl = `${appUrl}/onboard/${token.token}`;

  if (sendEmail) {
    await sendOnboardingLinkEmail({
      to: personalEmail || officialEmail,
      employeeName: fullName,
      onboardingUrl,
    });
  }

  return NextResponse.json({ employee, token: token.token, onboardingUrl });
}
