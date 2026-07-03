# UCBS Employee Onboarding Portal

A Next.js (App Router) web application that replaces paper/Word onboarding forms with a secure, link-based digital portal for new joinees and HR administrators.

## Features

- **Token-authenticated joinee portal** — 9-step onboarding wizard with autosave and per-step APIs
- **AWS S3 document storage** — Photos and documents uploaded to S3 via production API routes
- **Supabase backend** — PostgreSQL database for employees, drafts, submissions, and HR data
- **Selfie or gallery photo** — Passport photo on Basic Details step
- **E-signatures & policy acknowledgements** — Typed signatures with auto-captured dates
- **HR admin dashboard** — Search, filter, status management, induction checklist, IT asset allocation
- **Export** — Single-record PDF and bulk CSV export
- **Email notifications** — Onboarding link + submission confirmation via Resend (console fallback in dev)
- **Security** — Encrypted Aadhaar/PAN/bank fields, rate-limited APIs, expiring tokens

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui-style components
- React Hook Form + Zod
- **Supabase** (PostgreSQL)
- **AWS S3** (file uploads)
- NextAuth (credentials)
- Resend (email) + jsPDF (PDF export)

## Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier)
- [AWS](https://aws.amazon.com) account with S3 bucket (free tier eligible)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_SECRET` | Random 32+ char secret for sessions |
| `ENCRYPTION_KEY` | 64-char hex string (32 bytes) for AES-256 |
| `AWS_REGION` | S3 bucket region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | IAM user access key with S3 permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_S3_BUCKET` | S3 bucket name for uploads |
| `TOKEN_EXPIRY_DAYS` | Onboarding link expiry (default: 30) |
| `RESEND_API_KEY` | Optional — emails log to console if empty |
| `APP_URL` | Public app URL for links in emails |

### 3. Create Supabase tables

Run the SQL in `supabase/schema.sql` in your Supabase project **SQL Editor**.

### 4. Configure AWS S3

1. Create an S3 bucket (Block Public Access can stay on — the app uses presigned URLs).
2. Create an IAM user with `s3:PutObject` and `s3:GetObject` on the bucket.
3. Add the credentials to `.env`.

### 5. Seed sample data

```bash
npm run db:seed
```

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `hr@ucbs.com` | `hradmin123` |

The seed script prints a sample onboarding link for employee **Priya Sharma (UCBS-2026-0001)**.

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/onboard/[token]` | GET | Load form data |
| `/api/onboard/[token]/draft` | PUT | Autosave full draft |
| `/api/onboard/[token]/steps/[step]` | PUT | Save individual wizard step (1–8) |
| `/api/onboard/[token]/upload` | POST | Upload file to S3 |
| `/api/onboard/[token]/submit` | POST | Final submission |
| `/api/admin/employees` | GET, POST | List / create employees |
| `/api/admin/employees/[id]` | GET, PATCH | View / update status, HR fields |
| `/api/admin/export/csv` | GET | CSV export |
| `/api/demo/start` | POST | Demo onboarding (UCBS employee IDs) |

## Employee ID format

All employee IDs use the **`UCBS-YYYY-####`** format (e.g. `UCBS-2026-0001`). Demo and HR create flows auto-generate IDs when not provided.

## Required documents

Only these uploads are mandatory: **Aadhaar card**, **passport photo**, and **resume**. All other form fields and documents are optional.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/try` | Start demo onboarding |
| `/onboard/[token]` | Joinee multi-step form (token auth) |
| `/admin/login` | HR login |
| `/admin/dashboard` | Employee list, search, filters, create link |
| `/admin/employees/[id]` | Full record view, HR fields, PDF export |
