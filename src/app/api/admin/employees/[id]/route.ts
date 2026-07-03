import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getEmployeeWithDetails,
  loadFormDataForEmployee,
  reopenForEdits,
  updateEmployeeStatus,
} from "@/lib/onboarding-service";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateOnboardingPDF } from "@/lib/pdf";
import { getTokenExpiryDate } from "@/lib/rate-limit";
import { sendOnboardingLinkEmail } from "@/lib/email";
import type { EmployeeStatus } from "@/lib/types/employee";
import { mapEmployee, type DbEmployeeRow } from "@/lib/types/employee";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES: EmployeeStatus[] = ["INVITED", "IN_PROGRESS", "SUBMITTED", "VERIFIED"];

function mapInductionChecklist(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    hrOrientation: row.hr_orientation,
    hrOrientationRemarks: row.hr_orientation_remarks,
    itSetup: row.it_setup,
    itSetupRemarks: row.it_setup_remarks,
    emailCreated: row.email_created,
    emailCreatedRemarks: row.email_created_remarks,
    idCardIssued: row.id_card_issued,
    idCardIssuedRemarks: row.id_card_issued_remarks,
    payroll: row.payroll,
    payrollRemarks: row.payroll_remarks,
    attendance: row.attendance,
    attendanceRemarks: row.attendance_remarks,
    departmentInduction: row.department_induction,
    departmentInductionRemarks: row.department_induction_remarks,
    safetyBriefing: row.safety_briefing,
    safetyBriefingRemarks: row.safety_briefing_remarks,
  };
}

function serializeEmployeeForAdmin(employee: Awaited<ReturnType<typeof getEmployeeWithDetails>>) {
  if (!employee) return null;
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    fullName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    status: employee.status,
    dateOfJoining: employee.dateOfJoining.toISOString(),
    hrRemarks: employee.hrRemarks,
    officialEmail: employee.officialEmail,
    submittedAt: employee.submittedAt?.toISOString() || null,
    tokens: employee.tokens,
    inductionChecklist: mapInductionChecklist(employee.inductionChecklist as Record<string, unknown> | null),
    itAssetAllocations: (employee.itAssetAllocations || []).map((a: Record<string, unknown>) => ({
      id: a.id,
      asset: a.asset,
      assetId: a.asset_id,
      condition: a.condition,
      employeeAck: a.employee_ack,
    })),
  };
}

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

  return NextResponse.json({
    employee: serializeEmployeeForAdmin(employee),
    formData,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    if (body.action === "reopen") {
      await reopenForEdits(id);
      return NextResponse.json({ success: true, employee: { status: "IN_PROGRESS" } });
    }

    if (body.action === "resend-link") {
      const { data: empRow } = await supabase.from("employees").select("*").eq("id", id).single();
      if (!empRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const employee = mapEmployee(empRow as DbEmployeeRow);

      await supabase
        .from("onboarding_tokens")
        .update({ is_active: false })
        .eq("employee_id", id)
        .eq("is_active", true);

      const { data: token, error } = await supabase
        .from("onboarding_tokens")
        .insert({ employee_id: id, expires_at: getTokenExpiryDate().toISOString() })
        .select("*")
        .single();

      if (error || !token) {
        return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
      }

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const onboardingUrl = `${appUrl}/onboard/${token.token}`;
      await sendOnboardingLinkEmail({
        to: employee.personalEmail || employee.officialEmail || "onboarding@ucbs.com",
        employeeName: employee.fullName,
        onboardingUrl,
      });

      return NextResponse.json({ onboardingUrl, token: token.token });
    }

    if (body.action === "update-status") {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      await updateEmployeeStatus(id, body.status, body.hrRemarks);
      return NextResponse.json({ success: true, employee: { status: body.status } });
    }

    const { status, hrRemarks, officialEmail, inductionChecklist, itAssetAllocations } = body;

    const employeeUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined && status !== null && status !== "") {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      employeeUpdate.status = status;
    }

    if (hrRemarks !== undefined) {
      employeeUpdate.hr_remarks = hrRemarks;
    }

    if (officialEmail !== undefined) {
      const email = String(officialEmail).trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid official email format" }, { status: 400 });
      }

      const { data: empRow } = await supabase.from("employees").select("draft_data").eq("id", id).single();
      let draftData = empRow?.draft_data;
      if (draftData && typeof draftData === "object") {
        const draft = draftData as Record<string, unknown>;
        const basic = (draft.basic as Record<string, unknown>) || {};
        draftData = { ...draft, basic: { ...basic, officialEmail: email } };
      }

      employeeUpdate.official_email = email || null;
      employeeUpdate.draft_data = draftData;
    }

    const { data: updatedEmployee, error: employeeError } = await supabase
      .from("employees")
      .update(employeeUpdate)
      .eq("id", id)
      .select("status, hr_remarks, official_email")
      .single();

    if (employeeError) {
      console.error("[PATCH employee update]", employeeError);
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    if (inductionChecklist) {
      const { error: inductionError } = await supabase.from("induction_checklists").upsert(
        {
          employee_id: id,
          hr_orientation: !!inductionChecklist.hrOrientation,
          hr_orientation_remarks: inductionChecklist.hrOrientationRemarks || null,
          it_setup: !!inductionChecklist.itSetup,
          it_setup_remarks: inductionChecklist.itSetupRemarks || null,
          email_created: !!inductionChecklist.emailCreated,
          email_created_remarks: inductionChecklist.emailCreatedRemarks || null,
          id_card_issued: !!inductionChecklist.idCardIssued,
          id_card_issued_remarks: inductionChecklist.idCardIssuedRemarks || null,
          payroll: !!inductionChecklist.payroll,
          payroll_remarks: inductionChecklist.payrollRemarks || null,
          attendance: !!inductionChecklist.attendance,
          attendance_remarks: inductionChecklist.attendanceRemarks || null,
          department_induction: !!inductionChecklist.departmentInduction,
          department_induction_remarks: inductionChecklist.departmentInductionRemarks || null,
          safety_briefing: !!inductionChecklist.safetyBriefing,
          safety_briefing_remarks: inductionChecklist.safetyBriefingRemarks || null,
        },
        { onConflict: "employee_id" }
      );

      if (inductionError) {
        console.error("[PATCH induction]", inductionError);
        return NextResponse.json({ error: inductionError.message }, { status: 500 });
      }
    }

    if (itAssetAllocations) {
      const { error: deleteError } = await supabase.from("it_asset_allocations").delete().eq("employee_id", id);
      if (deleteError) {
        console.error("[PATCH assets delete]", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (itAssetAllocations.length) {
        const { error: insertError } = await supabase.from("it_asset_allocations").insert(
          itAssetAllocations.map(
            (
              a: { asset: string; assetId: string; condition?: string; employeeAck?: boolean },
              i: number
            ) => ({
              employee_id: id,
              asset: a.asset,
              asset_id: a.assetId,
              condition: a.condition || null,
              employee_ack: a.employeeAck || false,
              sort_order: i,
            })
          )
        );

        if (insertError) {
          console.error("[PATCH assets insert]", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        status: updatedEmployee.status,
        hrRemarks: updatedEmployee.hr_remarks,
        officialEmail: updatedEmployee.official_email,
      },
    });
  } catch (error) {
    console.error("[PATCH employee]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save changes" },
      { status: 500 }
    );
  }
}
