import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBulkCSV } from "@/lib/pdf";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  const csv = generateBulkCSV(
    employees.map((e) => ({
      employeeId: e.employeeId,
      fullName: e.fullName,
      department: e.department,
      designation: e.designation,
      status: e.status,
      dateOfJoining: e.dateOfJoining.toISOString().split("T")[0],
      officialEmail: e.officialEmail || "",
      mobileNumber: e.mobileNumber || "",
      submittedAt: e.submittedAt?.toISOString() || "",
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="ucbs-onboarding-export.csv"',
    },
  });
}
