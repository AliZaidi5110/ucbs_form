export type EmployeeStatus = "INVITED" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED";

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  reportingManager: string | null;
  dateOfJoining: Date;
  workLocation: string;
  officialEmail: string | null;
  personalEmail: string | null;
  mobileNumber: string | null;
  alternateMobile: string | null;
  photographUrl: string | null;
  status: EmployeeStatus;
  draftData: unknown | null;
  hrRemarks: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingTokenRecord {
  id: string;
  token: string;
  employeeId: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  employee: Employee;
}

export interface DbEmployeeRow {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  designation: string;
  reporting_manager: string | null;
  date_of_joining: string;
  work_location: string;
  official_email: string | null;
  personal_email: string | null;
  mobile_number: string | null;
  alternate_mobile: string | null;
  photograph_url: string | null;
  status: EmployeeStatus;
  draft_data: unknown | null;
  hr_remarks: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapEmployee(row: DbEmployeeRow): Employee {
  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    department: row.department,
    designation: row.designation,
    reportingManager: row.reporting_manager,
    dateOfJoining: new Date(row.date_of_joining),
    workLocation: row.work_location,
    officialEmail: row.official_email,
    personalEmail: row.personal_email,
    mobileNumber: row.mobile_number,
    alternateMobile: row.alternate_mobile,
    photographUrl: row.photograph_url,
    status: row.status,
    draftData: row.draft_data,
    hrRemarks: row.hr_remarks,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
