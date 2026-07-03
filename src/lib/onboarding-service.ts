import { getSupabaseAdmin } from "./supabase";
import { encryptIfPresent, decryptIfPresent } from "./encryption";
import { resolveUploadUrl } from "./supabase-storage";
import { getTokenExpiryDate } from "./rate-limit";
import type { OnboardingFormData } from "./validations/onboarding";
import { getDefaultFormValues, mergeDraftWithDefaults } from "./validations/onboarding";
import type { Employee, EmployeeStatus, OnboardingTokenRecord } from "./types/employee";
import { mapEmployee, type DbEmployeeRow } from "./types/employee";

const STEP_KEYS: Record<number, keyof OnboardingFormData> = {
  1: "basic",
  2: "personal",
  3: "identification",
  4: "education",
  5: "employment",
  6: "professional",
  7: "documents",
  8: "acknowledgements",
};

export async function getEmployeeByToken(token: string): Promise<OnboardingTokenRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("onboarding_tokens")
    .select("*, employees(*)")
    .eq("token", token)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const empRow = (data.employees ?? data.employee) as DbEmployeeRow | undefined;
  if (!empRow) return null;

  const emp = mapEmployee(empRow);
  return {
    id: data.id,
    token: data.token,
    employeeId: data.employee_id,
    expiresAt: new Date(data.expires_at),
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    employee: emp,
  };
}

async function refreshDocumentUrls(formData: OnboardingFormData): Promise<OnboardingFormData> {
  const uploads = await Promise.all(
    formData.documents.uploads.map(async (u) => ({
      ...u,
      fileUrl: await resolveUploadUrl(u.fileUrl, u.fileKey),
    }))
  );

  let photographUrl = formData.basic.photographUrl;
  const personalUpload = uploads.find((u) => u.documentType === "personal");
  if (personalUpload) photographUrl = personalUpload.fileUrl;
  else if (photographUrl) {
    const p = formData.documents.uploads.find((u) => u.documentType === "personal");
    if (p) photographUrl = await resolveUploadUrl(photographUrl, p.fileKey);
  }

  return {
    ...formData,
    basic: { ...formData.basic, photographUrl },
    documents: { uploads },
  };
}

export async function loadFormDataForEmployee(employee: Employee): Promise<OnboardingFormData> {
  const defaults = getDefaultFormValues(employee);

  if (employee.draftData && employee.status !== "SUBMITTED" && employee.status !== "VERIFIED") {
    const merged = mergeDraftWithDefaults(defaults, employee.draftData as Partial<OnboardingFormData>);
    return refreshDocumentUrls(merged);
  }

  if (employee.status === "SUBMITTED" || employee.status === "VERIFIED") {
    const loaded = await loadSubmittedFormData(employee.id);
    if (loaded) return refreshDocumentUrls(loaded);
  }

  return refreshDocumentUrls(defaults);
}

async function loadSubmittedFormData(employeeId: string): Promise<OnboardingFormData | null> {
  const supabase = getSupabaseAdmin();

  const { data: empRow } = await supabase.from("employees").select("*").eq("id", employeeId).single();
  if (!empRow) return null;

  const employee = mapEmployee(empRow as DbEmployeeRow);
  const defaults = getDefaultFormValues(employee);

  const [
    { data: personal },
    { data: identification },
    { data: bank },
    { data: education },
    { data: employment },
    { data: professional },
    { data: itRequest },
    { data: documents },
    { data: acknowledgement },
  ] = await Promise.all([
    supabase.from("personal_details").select("*").eq("employee_id", employeeId).maybeSingle(),
    supabase.from("identification_details").select("*").eq("employee_id", employeeId).maybeSingle(),
    supabase.from("bank_details").select("*").eq("employee_id", employeeId).maybeSingle(),
    supabase.from("education").select("*").eq("employee_id", employeeId).order("sort_order"),
    supabase.from("employment_history").select("*").eq("employee_id", employeeId).order("sort_order"),
    supabase.from("professional_summary").select("*").eq("employee_id", employeeId).maybeSingle(),
    supabase.from("it_requests").select("*").eq("employee_id", employeeId).maybeSingle(),
    supabase.from("document_uploads").select("*").eq("employee_id", employeeId),
    supabase.from("acknowledgements").select("*").eq("employee_id", employeeId).maybeSingle(),
  ]);

  return {
    basic: {
      ...defaults.basic,
      fullName: employee.fullName,
      photographUrl: employee.photographUrl || "",
      personalEmail: employee.personalEmail || "",
      mobileNumber: employee.mobileNumber || "",
      alternateMobile: employee.alternateMobile || "",
    },
    personal: personal
      ? {
          dateOfBirth: personal.date_of_birth?.split("T")[0] || "",
          gender: personal.gender || "PREFER_NOT_TO_SAY",
          genderSelfDescribe: personal.gender_self_describe || "",
          maritalStatus: personal.marital_status || "SINGLE",
          bloodGroup: personal.blood_group || "",
          nationality: personal.nationality || "",
          currentAddress: personal.current_address || "",
          permanentAddress: personal.permanent_address || "",
          sameAsCurrent: personal.same_as_current,
          emergencyContactName: personal.emergency_contact_name || "",
          emergencyContactPhone: personal.emergency_contact_phone || "",
          emergencyRelationship: personal.emergency_relationship || "",
        }
      : defaults.personal,
    identification: {
      aadhaarNumber: decryptIfPresent(identification?.aadhaar_number) || "",
      panNumber: decryptIfPresent(identification?.pan_number) || "",
      uan: identification?.uan || "",
      esic: identification?.esic || "",
      bankName: bank?.bank_name || "",
      accountHolderName: bank?.account_holder_name || "",
      accountNumber: decryptIfPresent(bank?.account_number) || "",
      ifscCode: bank?.ifsc_code || "",
      branch: bank?.branch || "",
    },
    education: {
      entries: education?.length
        ? education.map((e) => ({
            qualification: e.qualification,
            institution: e.institution,
            year: e.year,
            percentage: e.percentage,
          }))
        : defaults.education.entries,
    },
    employment: {
      isFresher: !employment?.length,
      entries: (employment || []).map((e) => ({
        company: e.company,
        designation: e.designation,
        fromDate: e.from_date,
        toDate: e.to_date,
        lastDrawnCtc: e.last_drawn_ctc || "",
        reasonForLeaving: e.reason_for_leaving || "",
      })),
    },
    professional: professional
      ? {
          keySkills: (professional.key_skills as string[]) || [],
          totalYearsExperience: professional.total_years_experience || "",
          relevantIndustryExperience: professional.relevant_industry_experience || "",
          majorAchievements: professional.major_achievements || "",
        }
      : defaults.professional,
    it: itRequest
      ? {
          laptopRequired: itRequest.laptop_required,
          officialEmailNeeded: itRequest.official_email_needed,
          simCardRequired: itRequest.sim_card_required,
          accessRequired: (itRequest.access_required as string[]) || [],
          accessOther: itRequest.access_other || "",
        }
      : defaults.it,
    documents: {
      uploads: (documents || []).map((d) => ({
        documentType: d.document_type,
        fileName: d.file_name,
        fileUrl: d.file_url,
        fileKey: d.file_key,
        mimeType: d.mime_type || undefined,
      })),
    },
    acknowledgements: acknowledgement
      ? {
          understoodPolicies: acknowledgement.understood_policies,
          maintainConfidentiality: acknowledgement.maintain_confidentiality,
          agreeCompanyRules: acknowledgement.agree_company_rules,
          understandAttendancePolicy: acknowledgement.understand_attendance_policy,
          receivedSafetyInfo: acknowledgement.received_safety_info,
          agreeCodeOfConduct: acknowledgement.agree_code_of_conduct,
          acknowledgeNda: acknowledgement.acknowledge_nda,
          agreeAssetHandling: acknowledgement.agree_asset_handling,
          declarationSignature: acknowledgement.declaration_signature || "",
          ndaSignature: acknowledgement.nda_signature || "",
          codeOfConductSignature: acknowledgement.code_of_conduct_signature || "",
        }
      : defaults.acknowledgements,
  };
}

export async function saveDraft(employeeId: string, data: OnboardingFormData) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("employees")
    .update({
      draft_data: data,
      status: "IN_PROGRESS",
      full_name: data.basic.fullName,
      personal_email: data.basic.personalEmail,
      mobile_number: data.basic.mobileNumber,
      alternate_mobile: data.basic.alternateMobile || null,
      photograph_url: data.basic.photographUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId);

  if (error) throw new Error(error.message);
}

export async function saveStep(
  employeeId: string,
  stepNumber: number,
  stepData: unknown,
  existingDraft: OnboardingFormData | null
) {
  const key = STEP_KEYS[stepNumber];
  if (!key) throw new Error("Invalid step number");

  const supabase = getSupabaseAdmin();
  const { data: empRow } = await supabase.from("employees").select("*").eq("id", employeeId).single();
  if (!empRow) throw new Error("Employee not found");

  const employee = mapEmployee(empRow as DbEmployeeRow);
  const base = existingDraft || getDefaultFormValues(employee);
  const merged: OnboardingFormData = { ...base, [key]: stepData };

  await saveDraft(employeeId, merged);
  return merged;
}

export async function submitOnboarding(employeeId: string, data: OnboardingFormData) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: empError } = await supabase
    .from("employees")
    .update({
      full_name: data.basic.fullName,
      department: data.basic.department || undefined,
      designation: data.basic.designation || undefined,
      reporting_manager: data.basic.reportingManager || null,
      date_of_joining: data.basic.dateOfJoining,
      work_location: data.basic.workLocation,
      personal_email: data.basic.personalEmail,
      mobile_number: data.basic.mobileNumber,
      alternate_mobile: data.basic.alternateMobile || null,
      photograph_url: data.basic.photographUrl || null,
      status: "SUBMITTED",
      submitted_at: now,
      draft_data: null,
      updated_at: now,
    })
    .eq("id", employeeId);

  if (empError) throw new Error(empError.message);

  await supabase.from("personal_details").upsert(
    {
      employee_id: employeeId,
      date_of_birth: data.personal.dateOfBirth || null,
      gender: data.personal.gender,
      gender_self_describe: data.personal.genderSelfDescribe || null,
      marital_status: data.personal.maritalStatus,
      blood_group: data.personal.bloodGroup || null,
      nationality: data.personal.nationality || null,
      current_address: data.personal.currentAddress || null,
      permanent_address: data.personal.permanentAddress || null,
      same_as_current: data.personal.sameAsCurrent,
      emergency_contact_name: data.personal.emergencyContactName || null,
      emergency_contact_phone: data.personal.emergencyContactPhone || null,
      emergency_relationship: data.personal.emergencyRelationship || null,
    },
    { onConflict: "employee_id" }
  );

  await supabase.from("identification_details").upsert(
    {
      employee_id: employeeId,
      aadhaar_number: data.identification.aadhaarNumber
        ? encryptIfPresent(data.identification.aadhaarNumber)
        : null,
      pan_number: data.identification.panNumber
        ? encryptIfPresent(data.identification.panNumber.toUpperCase())
        : null,
      uan: data.identification.uan || null,
      esic: data.identification.esic || null,
    },
    { onConflict: "employee_id" }
  );

  if (
    data.identification.bankName ||
    data.identification.accountNumber ||
    data.identification.ifscCode
  ) {
    await supabase.from("bank_details").upsert(
      {
        employee_id: employeeId,
        bank_name: data.identification.bankName || null,
        account_holder_name: data.identification.accountHolderName || null,
        account_number: data.identification.accountNumber
          ? encryptIfPresent(data.identification.accountNumber)
          : null,
        ifsc_code: data.identification.ifscCode?.toUpperCase() || null,
        branch: data.identification.branch || null,
      },
      { onConflict: "employee_id" }
    );
  }

  await supabase.from("education").delete().eq("employee_id", employeeId);
  if (data.education.entries.length) {
    const validEntries = data.education.entries.filter((e) => e.qualification && e.institution);
    if (validEntries.length) {
      await supabase.from("education").insert(
        validEntries.map((e, i) => ({
          employee_id: employeeId,
          qualification: e.qualification,
          institution: e.institution,
          year: e.year,
          percentage: e.percentage,
          sort_order: i,
        }))
      );
    }
  }

  await supabase.from("employment_history").delete().eq("employee_id", employeeId);
  if (!data.employment.isFresher && data.employment.entries.length) {
    await supabase.from("employment_history").insert(
      data.employment.entries.map((e, i) => ({
        employee_id: employeeId,
        company: e.company,
        designation: e.designation,
        from_date: e.fromDate,
        to_date: e.toDate,
        last_drawn_ctc: e.lastDrawnCtc || null,
        reason_for_leaving: e.reasonForLeaving || null,
        sort_order: i,
      }))
    );
  }

  await supabase.from("professional_summary").upsert(
    {
      employee_id: employeeId,
      key_skills: data.professional.keySkills,
      total_years_experience: data.professional.totalYearsExperience || null,
      relevant_industry_experience: data.professional.relevantIndustryExperience || null,
      major_achievements: data.professional.majorAchievements || null,
    },
    { onConflict: "employee_id" }
  );

  await supabase.from("it_requests").upsert(
    {
      employee_id: employeeId,
      laptop_required: data.it.laptopRequired,
      official_email_needed: data.it.officialEmailNeeded,
      sim_card_required: data.it.simCardRequired,
      access_required: data.it.accessRequired,
      access_other: data.it.accessOther || null,
    },
    { onConflict: "employee_id" }
  );

  await supabase.from("document_uploads").delete().eq("employee_id", employeeId);
  if (data.documents.uploads.length) {
    await supabase.from("document_uploads").insert(
      data.documents.uploads.map((d) => ({
        employee_id: employeeId,
        document_type: d.documentType,
        file_name: d.fileName,
        file_url: d.fileUrl,
        file_key: d.fileKey,
        mime_type: d.mimeType || null,
      }))
    );
  }

  await supabase.from("acknowledgements").upsert(
    {
      employee_id: employeeId,
      understood_policies: data.acknowledgements.understoodPolicies,
      maintain_confidentiality: data.acknowledgements.maintainConfidentiality,
      agree_company_rules: data.acknowledgements.agreeCompanyRules,
      understand_attendance_policy: data.acknowledgements.understandAttendancePolicy,
      received_safety_info: data.acknowledgements.receivedSafetyInfo,
      agree_code_of_conduct: data.acknowledgements.agreeCodeOfConduct,
      acknowledge_nda: data.acknowledgements.acknowledgeNda,
      agree_asset_handling: data.acknowledgements.agreeAssetHandling,
      declaration_signature: data.acknowledgements.declarationSignature,
      declaration_date: now,
      nda_signature: data.acknowledgements.ndaSignature,
      nda_date: now,
      code_of_conduct_signature: data.acknowledgements.codeOfConductSignature,
      code_of_conduct_date: now,
    },
    { onConflict: "employee_id" }
  );
}

export async function reopenForEdits(employeeId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("employees")
    .update({ status: "IN_PROGRESS" as EmployeeStatus, updated_at: new Date().toISOString() })
    .eq("id", employeeId);
  if (error) throw new Error(error.message);
}

export async function updateEmployeeStatus(
  employeeId: string,
  status: EmployeeStatus,
  hrRemarks?: string
) {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (hrRemarks !== undefined) update.hr_remarks = hrRemarks;

  const { error } = await supabase.from("employees").update(update).eq("id", employeeId);
  if (error) throw new Error(error.message);
}

export async function getEmployeeWithDetails(id: string) {
  const supabase = getSupabaseAdmin();

  const { data: empRow } = await supabase.from("employees").select("*").eq("id", id).single();
  if (!empRow) return null;

  const employee = mapEmployee(empRow as DbEmployeeRow);

  const [
    { data: tokens },
    { data: personalDetails },
    { data: identificationDetails },
    { data: bankDetails },
    { data: education },
    { data: employmentHistory },
    { data: professionalSummary },
    { data: itRequest },
    { data: documentUploads },
    { data: acknowledgement },
    { data: inductionChecklist },
    { data: itAssetAllocations },
  ] = await Promise.all([
    supabase
      .from("onboarding_tokens")
      .select("*")
      .eq("employee_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("personal_details").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("identification_details").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("bank_details").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("education").select("*").eq("employee_id", id).order("sort_order"),
    supabase.from("employment_history").select("*").eq("employee_id", id).order("sort_order"),
    supabase.from("professional_summary").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("it_requests").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("document_uploads").select("*").eq("employee_id", id),
    supabase.from("acknowledgements").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("induction_checklists").select("*").eq("employee_id", id).maybeSingle(),
    supabase.from("it_asset_allocations").select("*").eq("employee_id", id).order("sort_order"),
  ]);

  return {
    ...employee,
    tokens: (tokens || []).map((t) => ({
      id: t.id,
      token: t.token,
      employeeId: t.employee_id,
      expiresAt: new Date(t.expires_at),
      isActive: t.is_active,
      createdAt: new Date(t.created_at),
    })),
    inductionChecklist: inductionChecklist
      ? {
          hrOrientation: inductionChecklist.hr_orientation,
          hrOrientationRemarks: inductionChecklist.hr_orientation_remarks,
          itSetup: inductionChecklist.it_setup,
          itSetupRemarks: inductionChecklist.it_setup_remarks,
          emailCreated: inductionChecklist.email_created,
          emailCreatedRemarks: inductionChecklist.email_created_remarks,
          idCardIssued: inductionChecklist.id_card_issued,
          idCardIssuedRemarks: inductionChecklist.id_card_issued_remarks,
          payroll: inductionChecklist.payroll,
          payrollRemarks: inductionChecklist.payroll_remarks,
          attendance: inductionChecklist.attendance,
          attendanceRemarks: inductionChecklist.attendance_remarks,
          departmentInduction: inductionChecklist.department_induction,
          departmentInductionRemarks: inductionChecklist.department_induction_remarks,
          safetyBriefing: inductionChecklist.safety_briefing,
          safetyBriefingRemarks: inductionChecklist.safety_briefing_remarks,
        }
      : null,
    itAssetAllocations: (itAssetAllocations || []).map((a) => ({
      id: a.id,
      asset: a.asset,
      assetId: a.asset_id,
      condition: a.condition,
      employeeAck: a.employee_ack,
    })),
    personalDetails,
    identificationDetails,
    bankDetails,
    education: education || [],
    employmentHistory: employmentHistory || [],
    professionalSummary,
    itRequest,
    documentUploads: documentUploads || [],
    acknowledgement,
  };
}

export async function listEmployees(filters: {
  search?: string;
  department?: string;
  status?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("employees").select("*, onboarding_tokens(*)").order("created_at", {
    ascending: false,
  });

  if (filters.department) query = query.eq("department", filters.department);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const emp = mapEmployee(row as DbEmployeeRow);
    const activeTokens = (row.onboarding_tokens || [])
      .filter((t: { is_active: boolean }) => t.is_active)
      .slice(0, 1)
      .map((t: { token: string }) => ({ token: t.token }));
    return { ...emp, tokens: activeTokens };
  });
}

export async function createEmployeeRecord(input: {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  reportingManager?: string | null;
  dateOfJoining: string;
  workLocation: string;
  officialEmail?: string | null;
  personalEmail?: string | null;
  mobileNumber: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      employee_id: input.employeeId,
      full_name: input.fullName,
      department: input.department,
      designation: input.designation,
      reporting_manager: input.reportingManager || null,
      date_of_joining: input.dateOfJoining,
      work_location: input.workLocation,
      official_email: input.officialEmail ? String(input.officialEmail).toLowerCase() : null,
      personal_email: input.personalEmail || null,
      mobile_number: input.mobileNumber,
      status: "INVITED",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { data: token, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .insert({
      employee_id: employee.id,
      expires_at: getTokenExpiryDate().toISOString(),
    })
    .select("*")
    .single();

  if (tokenError) throw new Error(tokenError.message);

  return { employee: mapEmployee(employee as DbEmployeeRow), token: token.token as string };
}
