import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateBulkCSV } from "@/lib/pdf";
import { mapEmployee, type DbEmployeeRow } from "@/lib/types/employee";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csv = generateBulkCSV(
    (data || []).map((row) => {
      const e = mapEmployee(row as DbEmployeeRow);
      return {
        employeeId: e.employeeId,
        fullName: e.fullName,
        department: e.department,
        designation: e.designation,
        status: e.status,
        dateOfJoining: e.dateOfJoining.toISOString().split("T")[0],
        officialEmail: e.officialEmail || "",
        mobileNumber: e.mobileNumber || "",
        submittedAt: e.submittedAt?.toISOString() || "",
      };
    })
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="ucbs-onboarding-export.csv"',
    },
  });
}
