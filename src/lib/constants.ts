export const DEPARTMENTS = [
  "Human Resources",
  "Information Technology",
  "Finance",
  "Operations",
  "Sales",
  "Marketing",
  "Engineering",
  "Administration",
  "Legal",
  "Customer Support",
] as const;

export const WORK_LOCATIONS = [
  "Head Office",
  "Branch — North",
  "Branch — South",
  "Branch — East",
  "Branch — West",
  "Remote",
] as const;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const ACCESS_OPTIONS = [
  "ERP",
  "CRM",
  "Attendance",
  "Payroll",
  "MS Office",
  "Shared Drive",
  "Other",
] as const;

export const REQUIRED_DOCUMENT_TYPES = ["aadhaar", "photo", "resume"] as const;

export const DOCUMENT_TYPE_KEYS = [
  "personal",
  "aadhaar",
  "photo",
  "resume",
  "pan",
  "education",
  "experience",
  "relieving",
  "salary",
  "bank",
  "other",
] as const;

/** Allowed MIME types per documentType — used by upload API and client hints */
export const DOCUMENT_MIME_TYPES: Record<
  (typeof REQUIRED_DOCUMENT_TYPES)[number] | string,
  readonly string[]
> = {
  personal: ["image/jpeg", "image/png", "image/jpg"],
  aadhaar: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  photo: ["image/jpeg", "image/png", "image/jpg"],
  resume: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const DOCUMENT_ACCEPT: Record<(typeof REQUIRED_DOCUMENT_TYPES)[number], string> = {
  aadhaar: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
  photo: ".jpg,.jpeg,.png,image/jpeg,image/png",
  resume: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const DOCUMENT_FORMAT_HINTS: Record<(typeof REQUIRED_DOCUMENT_TYPES)[number], string> = {
  aadhaar: "PDF, JPG, JPEG, or PNG (max 10MB)",
  photo: "JPG, JPEG, or PNG (max 10MB)",
  resume: "PDF, DOC, or DOCX (max 10MB)",
};

export const DOCUMENT_TYPES = [
  { key: "aadhaar", label: "Aadhaar Card", required: true },
  { key: "photo", label: "Passport Photo", required: true },
  { key: "resume", label: "Resume", required: true },
  { key: "pan", label: "PAN Card", required: false },
  { key: "education", label: "Educational Certificates", required: false },
  { key: "experience", label: "Experience Letters", required: false },
  { key: "relieving", label: "Relieving Letter", required: false },
  { key: "salary", label: "Salary Slips", required: false },
  { key: "bank", label: "Cancelled Cheque / Bank Proof", required: false },
  { key: "other", label: "Other", required: false },
] as const;

export type DocumentTypeKey = (typeof DOCUMENT_TYPES)[number]["key"];

export const ONBOARDING_STEPS = [
  { id: 1, title: "Basic Details", key: "basic", hint: "Verify your contact and joining information" },
  { id: 2, title: "Personal Details", key: "personal", hint: "Tell us about yourself and emergency contacts" },
  { id: 3, title: "ID & Bank", key: "identification", hint: "Government ID and salary account details" },
  { id: 4, title: "Education", key: "education", hint: "Your academic qualifications" },
  { id: 5, title: "Employment", key: "employment", hint: "Previous work experience or fresher status" },
  { id: 6, title: "Professional", key: "professional", hint: "Skills and career highlights" },
  { id: 7, title: "Documents", key: "documents", hint: "Upload required supporting documents" },
  { id: 8, title: "Acknowledgements", key: "acknowledgements", hint: "Review policies and sign declarations" },
  { id: 9, title: "Review", key: "review", hint: "Confirm everything before submitting" },
] as const;

export const INDUCTION_ITEMS = [
  { key: "hrOrientation", label: "HR Orientation", remarksKey: "hrOrientationRemarks" },
  { key: "itSetup", label: "IT Setup", remarksKey: "itSetupRemarks" },
  { key: "emailCreated", label: "Email Created", remarksKey: "emailCreatedRemarks" },
  { key: "idCardIssued", label: "ID Card Issued", remarksKey: "idCardIssuedRemarks" },
  { key: "payroll", label: "Payroll", remarksKey: "payrollRemarks" },
  { key: "attendance", label: "Attendance", remarksKey: "attendanceRemarks" },
  { key: "departmentInduction", label: "Department Induction", remarksKey: "departmentInductionRemarks" },
  { key: "safetyBriefing", label: "Safety Briefing", remarksKey: "safetyBriefingRemarks" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  INVITED: "Invited",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  VERIFIED: "Verified",
};

export const STATUS_COLORS: Record<string, string> = {
  INVITED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
};
