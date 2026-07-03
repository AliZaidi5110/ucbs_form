import { z } from "zod";
import {
  DOCUMENT_TYPE_KEYS,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentTypeKey,
} from "@/lib/constants";

const mobileRegex = /^[6-9]\d{9}$/;
const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const optionalString = z.string().optional().or(z.literal(""));

const documentTypeSchema = z.enum(DOCUMENT_TYPE_KEYS);

export const educationRowSchema = z.object({
  qualification: optionalString,
  institution: optionalString,
  year: optionalString,
  percentage: optionalString,
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
  documentType: documentTypeSchema,
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileKey: z.string().min(1, "File key is required"),
  mimeType: z.string().optional(),
});

export type DocumentUploadItem = z.infer<typeof documentUploadSchema>;

const DOCUMENT_LABELS: Record<(typeof REQUIRED_DOCUMENT_TYPES)[number], string> = {
  aadhaar: "Aadhaar Card",
  photo: "Passport Photo",
  resume: "Resume",
};

export function inferDocumentTypeFromFileKey(fileKey: string): DocumentTypeKey | undefined {
  const parts = fileKey.split("/");
  if (parts.length < 2) return undefined;
  const candidate = parts[1];
  return DOCUMENT_TYPE_KEYS.includes(candidate as DocumentTypeKey)
    ? (candidate as DocumentTypeKey)
    : undefined;
}

/** Normalize uploads saved before documentType was persisted on the API response. */
export function normalizeDocumentUploads(
  uploads: Array<Partial<DocumentUploadItem> & { fileKey?: string }>
): DocumentUploadItem[] {
  const normalized: DocumentUploadItem[] = [];

  for (const upload of uploads) {
    const documentType =
      upload.documentType && DOCUMENT_TYPE_KEYS.includes(upload.documentType)
        ? upload.documentType
        : inferDocumentTypeFromFileKey(upload.fileKey || "");

    if (!documentType || !upload.fileName || !upload.fileUrl || !upload.fileKey) {
      continue;
    }

    normalized.push({
      documentType,
      fileName: upload.fileName,
      fileUrl: upload.fileUrl,
      fileKey: upload.fileKey,
      mimeType: upload.mimeType,
    });
  }

  return normalized;
}

function isCompleteUpload(
  upload: DocumentUploadItem | undefined
): upload is DocumentUploadItem {
  return !!(
    upload &&
    upload.documentType &&
    upload.fileName &&
    upload.fileUrl &&
    upload.fileKey
  );
}

function missingDocumentMessage(type: (typeof REQUIRED_DOCUMENT_TYPES)[number]): string {
  const label = DOCUMENT_LABELS[type];
  const doc = DOCUMENT_TYPES.find((d) => d.key === type);
  return `${label} is required — please upload ${doc?.label.toLowerCase() ?? type}`;
}

export const documentsSchema = z
  .object({
    uploads: z.array(documentUploadSchema),
  })
  .superRefine((data, ctx) => {
    const normalized = normalizeDocumentUploads(data.uploads);

    for (const upload of normalized) {
      if (!upload.documentType || !DOCUMENT_TYPE_KEYS.includes(upload.documentType)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid document metadata — please re-upload the file",
          path: ["uploads"],
        });
      }
    }

    for (const type of REQUIRED_DOCUMENT_TYPES) {
      const match = normalized.find((u) => u.documentType === type);
      if (!isCompleteUpload(match)) {
        ctx.addIssue({
          code: "custom",
          message: missingDocumentMessage(type),
          path: [type],
        });
      }
    }
  });

export const onboardingFormSchema = z.object({
  basic: z.object({
    employeeId: z.string(),
    fullName: z.string().min(2, "Full name is required"),
    photographUrl: z.string().min(1, "Passport photo is required"),
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
    dateOfBirth: optionalString,
    gender: z.enum(["MALE", "FEMALE", "PREFER_NOT_TO_SAY", "SELF_DESCRIBE"]),
    genderSelfDescribe: optionalString,
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]),
    bloodGroup: optionalString,
    nationality: optionalString,
    currentAddress: optionalString,
    permanentAddress: optionalString,
    sameAsCurrent: z.boolean(),
    emergencyContactName: optionalString,
    emergencyContactPhone: z
      .string()
      .regex(mobileRegex, "Enter valid 10-digit number")
      .optional()
      .or(z.literal("")),
    emergencyRelationship: optionalString,
  }),
  identification: z.object({
    aadhaarNumber: z
      .string()
      .regex(aadhaarRegex, "Aadhaar must be 12 digits")
      .optional()
      .or(z.literal("")),
    panNumber: z
      .string()
      .regex(panRegex, "Invalid PAN format (e.g. ABCDE1234F)")
      .optional()
      .or(z.literal("")),
    uan: optionalString,
    esic: optionalString,
    bankName: optionalString,
    accountHolderName: optionalString,
    accountNumber: optionalString,
    ifscCode: z
      .string()
      .regex(ifscRegex, "Invalid IFSC code")
      .optional()
      .or(z.literal("")),
    branch: optionalString,
  }),
  education: z.object({
    entries: z.array(educationRowSchema),
  }),
  employment: z.object({
    isFresher: z.boolean(),
    entries: z.array(employmentRowSchema),
  }),
  professional: z.object({
    keySkills: z.array(z.string()),
    totalYearsExperience: optionalString,
    relevantIndustryExperience: optionalString,
    majorAchievements: optionalString,
  }),
  it: z.object({
    laptopRequired: z.boolean(),
    officialEmailNeeded: z.boolean(),
    simCardRequired: z.boolean(),
    accessRequired: z.array(z.string()),
    accessOther: optionalString,
  }),
  documents: documentsSchema,
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
  7: documentsSchema,
  8: onboardingFormSchema.shape.acknowledgements,
} as const;

export function getDefaultFormValues(employee: {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  reportingManager?: string | null;
  dateOfJoining: Date | string;
  workLocation: string;
  officialEmail?: string | null;
  personalEmail?: string | null;
  mobileNumber?: string | null;
  alternateMobile?: string | null;
  photographUrl?: string | null;
}): OnboardingFormData {
  const joinDate =
    employee.dateOfJoining instanceof Date
      ? employee.dateOfJoining.toISOString().split("T")[0]
      : String(employee.dateOfJoining).split("T")[0];

  return {
    basic: {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      photographUrl: employee.photographUrl || "",
      department: employee.department,
      designation: employee.designation,
      reportingManager: employee.reportingManager || "",
      dateOfJoining: joinDate,
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
  const documents = draft.documents
    ? { uploads: normalizeDocumentUploads(draft.documents.uploads ?? []) }
    : defaults.documents;

  return {
    basic: { ...defaults.basic, ...draft.basic },
    personal: { ...defaults.personal, ...draft.personal },
    identification: { ...defaults.identification, ...draft.identification },
    education: draft.education?.entries?.length ? draft.education : defaults.education,
    employment: { ...defaults.employment, ...draft.employment },
    professional: { ...defaults.professional, ...draft.professional },
    it: { ...defaults.it, ...draft.it },
    documents,
    acknowledgements: { ...defaults.acknowledgements, ...draft.acknowledgements },
  };
}
