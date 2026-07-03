import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;
const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const educationRowSchema = z.object({
  qualification: z.string().min(1, "Qualification is required"),
  institution: z.string().min(1, "Institution is required"),
  year: z.string().min(4, "Valid year required"),
  percentage: z.string().min(1, "Percentage/CGPA is required"),
});

export const employmentRowSchema = z.object({
  company: z.string().min(1, "Company is required"),
  designation: z.string().min(1, "Designation is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  lastDrawnCtc: z.string().optional(),
  reasonForLeaving: z.string().optional(),
});

export const documentUploadSchema = z.object({
  documentType: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileKey: z.string(),
  mimeType: z.string().optional(),
});

export const onboardingFormSchema = z.object({
  basic: z.object({
    employeeId: z.string(),
    fullName: z.string().min(2, "Full name is required"),
    photographUrl: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    reportingManager: z.string().optional(),
    dateOfJoining: z.string().min(1, "Date of joining is required"),
    workLocation: z.string().min(1, "Work location is required"),
    officialEmail: z.string().email().optional().or(z.literal("")),
    personalEmail: z.string().email("Valid personal email required"),
    mobileNumber: z.string().regex(mobileRegex, "Enter valid 10-digit mobile number"),
    alternateMobile: z.string().regex(mobileRegex, "Enter valid 10-digit number").optional().or(z.literal("")),
  }),
  personal: z.object({
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "PREFER_NOT_TO_SAY", "SELF_DESCRIBE"]),
    genderSelfDescribe: z.string().optional(),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]),
    bloodGroup: z.string().min(1, "Blood group is required"),
    nationality: z.string().min(1, "Nationality is required"),
    currentAddress: z.string().min(10, "Current address is required"),
    permanentAddress: z.string().min(10, "Permanent address is required"),
    sameAsCurrent: z.boolean(),
    emergencyContactName: z.string().min(2, "Emergency contact name required"),
    emergencyContactPhone: z.string().regex(mobileRegex, "Valid emergency contact number required"),
    emergencyRelationship: z.string().min(1, "Relationship is required"),
  }),
  identification: z.object({
    aadhaarNumber: z.string().regex(aadhaarRegex, "Aadhaar must be 12 digits"),
    panNumber: z.string().regex(panRegex, "Invalid PAN format (e.g. ABCDE1234F)"),
    uan: z.string().optional(),
    esic: z.string().optional(),
    bankName: z.string().min(2, "Bank name is required"),
    accountHolderName: z.string().min(2, "Account holder name is required"),
    accountNumber: z.string().min(8, "Valid account number required"),
    ifscCode: z.string().regex(ifscRegex, "Invalid IFSC code"),
    branch: z.string().min(2, "Branch is required"),
  }),
  education: z.object({
    entries: z.array(educationRowSchema).min(1, "Add at least one education entry"),
  }),
  employment: z.object({
    isFresher: z.boolean(),
    entries: z.array(employmentRowSchema),
  }),
  professional: z.object({
    keySkills: z.array(z.string()).min(1, "Add at least one skill"),
    totalYearsExperience: z.string().min(1, "Total experience is required"),
    relevantIndustryExperience: z.string().optional(),
    majorAchievements: z.string().optional(),
  }),
  it: z.object({
    laptopRequired: z.boolean(),
    officialEmailNeeded: z.boolean(),
    simCardRequired: z.boolean(),
    accessRequired: z.array(z.string()),
    accessOther: z.string().optional(),
  }),
  documents: z.object({
    uploads: z.array(documentUploadSchema),
  }),
  acknowledgements: z.object({
    understoodPolicies: z.boolean().refine((v) => v === true, { message: "Required" }),
    maintainConfidentiality: z.boolean().refine((v) => v === true, { message: "Required" }),
    agreeCompanyRules: z.boolean().refine((v) => v === true, { message: "Required" }),
    understandAttendancePolicy: z.boolean().refine((v) => v === true, { message: "Required" }),
    receivedSafetyInfo: z.boolean().refine((v) => v === true, { message: "Required" }),
    agreeCodeOfConduct: z.boolean().refine((v) => v === true, { message: "Required" }),
    acknowledgeNda: z.boolean().refine((v) => v === true, { message: "Required" }),
    agreeAssetHandling: z.boolean().refine((v) => v === true, { message: "Required" }),
    declarationSignature: z.string().min(2, "Type your full name as signature"),
    ndaSignature: z.string().min(2, "Type your full name as signature"),
    codeOfConductSignature: z.string().min(2, "Type your full name as signature"),
  }),
});

export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

export const stepSchemas = {
  1: onboardingFormSchema.shape.basic,
  2: onboardingFormSchema.shape.personal,
  3: onboardingFormSchema.shape.identification,
  4: onboardingFormSchema.shape.education,
  5: onboardingFormSchema.shape.employment.refine(
    (data) => data.isFresher || data.entries.length > 0,
    { message: "Add at least one employment entry or mark as fresher", path: ["entries"] }
  ),
  6: onboardingFormSchema.shape.professional,
  7: onboardingFormSchema.shape.documents,
  8: onboardingFormSchema.shape.acknowledgements,
} as const;

export function getDefaultFormValues(employee: {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  reportingManager?: string | null;
  dateOfJoining: Date;
  workLocation: string;
  officialEmail: string;
  personalEmail?: string | null;
  mobileNumber?: string | null;
  alternateMobile?: string | null;
  photographUrl?: string | null;
}): OnboardingFormData {
  return {
    basic: {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      photographUrl: employee.photographUrl || "",
      department: employee.department,
      designation: employee.designation,
      reportingManager: employee.reportingManager || "",
      dateOfJoining: employee.dateOfJoining.toISOString().split("T")[0],
      workLocation: employee.workLocation,
      officialEmail: employee.officialEmail || "",
      personalEmail: employee.personalEmail || "",
      mobileNumber: employee.mobileNumber || "",
      alternateMobile: employee.alternateMobile || "",
    },
    personal: {
      dateOfBirth: "",
      gender: "PREFER_NOT_TO_SAY",
      genderSelfDescribe: "",
      maritalStatus: "SINGLE",
      bloodGroup: "",
      nationality: "Indian",
      currentAddress: "",
      permanentAddress: "",
      sameAsCurrent: false,
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyRelationship: "",
    },
    identification: {
      aadhaarNumber: "",
      panNumber: "",
      uan: "",
      esic: "",
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
    },
    education: { entries: [{ qualification: "", institution: "", year: "", percentage: "" }] },
    employment: { isFresher: true, entries: [] },
    professional: {
      keySkills: [],
      totalYearsExperience: "",
      relevantIndustryExperience: "",
      majorAchievements: "",
    },
    it: {
      laptopRequired: false,
      officialEmailNeeded: true,
      simCardRequired: false,
      accessRequired: [],
      accessOther: "",
    },
    documents: { uploads: [] },
    acknowledgements: {
      understoodPolicies: true,
      maintainConfidentiality: true,
      agreeCompanyRules: true,
      understandAttendancePolicy: true,
      receivedSafetyInfo: true,
      agreeCodeOfConduct: true,
      acknowledgeNda: true,
      agreeAssetHandling: true,
      declarationSignature: "",
      ndaSignature: "",
      codeOfConductSignature: "",
    },
  };
}

export function mergeDraftWithDefaults(
  defaults: OnboardingFormData,
  draft: Partial<OnboardingFormData> | null
): OnboardingFormData {
  if (!draft) return defaults;
  return {
    basic: { ...defaults.basic, ...draft.basic },
    personal: { ...defaults.personal, ...draft.personal },
    identification: { ...defaults.identification, ...draft.identification },
    education: draft.education?.entries?.length
      ? draft.education
      : defaults.education,
    employment: { ...defaults.employment, ...draft.employment },
    professional: { ...defaults.professional, ...draft.professional },
    it: { ...defaults.it, ...draft.it },
    documents: draft.documents || defaults.documents,
    acknowledgements: { ...defaults.acknowledgements, ...draft.acknowledgements },
  };
}
