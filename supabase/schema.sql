-- UCBS Employee Onboarding Portal — Supabase (PostgreSQL) schema
-- Run this in the Supabase SQL Editor for a fresh project.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS hr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'HR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  reporting_manager TEXT,
  date_of_joining DATE NOT NULL,
  work_location TEXT NOT NULL,
  official_email TEXT,
  personal_email TEXT,
  mobile_number TEXT,
  alternate_mobile TEXT,
  photograph_url TEXT,
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED')),
  draft_data JSONB,
  hr_remarks TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

CREATE TABLE IF NOT EXISTS onboarding_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_token ON onboarding_tokens(token);

CREATE TABLE IF NOT EXISTS personal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY', 'SELF_DESCRIBE')),
  gender_self_describe TEXT,
  marital_status TEXT CHECK (marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER')),
  blood_group TEXT,
  nationality TEXT,
  current_address TEXT,
  permanent_address TEXT,
  same_as_current BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_relationship TEXT
);

CREATE TABLE IF NOT EXISTS identification_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  aadhaar_number TEXT,
  pan_number TEXT,
  uan TEXT,
  esic TEXT
);

CREATE TABLE IF NOT EXISTS bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  branch TEXT
);

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  institution TEXT NOT NULL,
  year TEXT NOT NULL,
  percentage TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS employment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  designation TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  last_drawn_ctc TEXT,
  reason_for_leaving TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS professional_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  key_skills JSONB NOT NULL DEFAULT '[]',
  total_years_experience TEXT,
  relevant_industry_experience TEXT,
  major_achievements TEXT
);

CREATE TABLE IF NOT EXISTS it_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  laptop_required BOOLEAN NOT NULL DEFAULT FALSE,
  official_email_needed BOOLEAN NOT NULL DEFAULT FALSE,
  sim_card_required BOOLEAN NOT NULL DEFAULT FALSE,
  access_required JSONB NOT NULL DEFAULT '[]',
  access_other TEXT
);

CREATE TABLE IF NOT EXISTS document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  understood_policies BOOLEAN NOT NULL DEFAULT FALSE,
  maintain_confidentiality BOOLEAN NOT NULL DEFAULT FALSE,
  agree_company_rules BOOLEAN NOT NULL DEFAULT FALSE,
  understand_attendance_policy BOOLEAN NOT NULL DEFAULT FALSE,
  received_safety_info BOOLEAN NOT NULL DEFAULT FALSE,
  agree_code_of_conduct BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledge_nda BOOLEAN NOT NULL DEFAULT FALSE,
  agree_asset_handling BOOLEAN NOT NULL DEFAULT FALSE,
  declaration_signature TEXT,
  declaration_date TIMESTAMPTZ,
  nda_signature TEXT,
  nda_date TIMESTAMPTZ,
  code_of_conduct_signature TEXT,
  code_of_conduct_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS induction_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  hr_orientation BOOLEAN NOT NULL DEFAULT FALSE,
  hr_orientation_remarks TEXT,
  it_setup BOOLEAN NOT NULL DEFAULT FALSE,
  it_setup_remarks TEXT,
  email_created BOOLEAN NOT NULL DEFAULT FALSE,
  email_created_remarks TEXT,
  id_card_issued BOOLEAN NOT NULL DEFAULT FALSE,
  id_card_issued_remarks TEXT,
  payroll BOOLEAN NOT NULL DEFAULT FALSE,
  payroll_remarks TEXT,
  attendance BOOLEAN NOT NULL DEFAULT FALSE,
  attendance_remarks TEXT,
  department_induction BOOLEAN NOT NULL DEFAULT FALSE,
  department_induction_remarks TEXT,
  safety_briefing BOOLEAN NOT NULL DEFAULT FALSE,
  safety_briefing_remarks TEXT
);

CREATE TABLE IF NOT EXISTS it_asset_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  condition TEXT,
  employee_ack BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS hr_users_updated_at ON hr_users;
CREATE TRIGGER hr_users_updated_at
  BEFORE UPDATE ON hr_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
