# UCBS Employee Onboarding Portal

A Next.js (App Router) web application that replaces paper/Word onboarding forms with a secure, link-based digital portal for new joinees and HR administrators.

## Features

- **Token-authenticated joinee portal** — Multi-step onboarding wizard (10 steps) with autosave
- **Document uploads** — Local storage with signed URLs (S3/UploadThing-ready architecture)
- **E-signatures & policy acknowledgements** — Typed signatures with auto-captured dates
- **HR admin dashboard** — Search, filter, status management, induction checklist, IT asset allocation
- **Export** — Single-record PDF and bulk CSV export
- **Email notifications** — Onboarding link + submission confirmation via Resend (console fallback in dev)
- **Security** — Encrypted Aadhaar/PAN/bank fields, rate-limited APIs, expiring tokens

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui-style components
- React Hook Form + Zod
- Prisma + PostgreSQL
- NextAuth (credentials)
- Resend (email) + jsPDF (PDF export)

## Prerequisites

- Node.js 18+
- PostgreSQL database (local, Docker, or cloud e.g. [Neon](https://neon.tech))

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
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char secret for sessions |
| `ENCRYPTION_KEY` | 64-char hex string (32 bytes) for AES-256 |
| `TOKEN_EXPIRY_DAYS` | Onboarding link expiry (default: 30) |
| `RESEND_API_KEY` | Optional — emails log to console if empty |
| `EMAIL_FROM` | Sender address for emails |
| `APP_URL` | Public app URL for links in emails |
| `UPLOAD_SECRET` | Secret for signing document URLs |

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start PostgreSQL (optional Docker)

```bash
docker compose up -d
```

### 4. Initialize database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `hr@ucbs.com` | `hradmin123` |

The seed script prints a sample onboarding link for employee **Priya Sharma (UCBS-2026-001)**.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/onboard/[token]` | Joinee multi-step form (token auth) |
| `/admin/login` | HR login |
| `/admin/dashboard` | Employee list, search, filters, create link |
| `/admin/employees/[id]` | Full record view, HR fields, PDF export |

## Onboarding Form Steps

1. Basic Details  
2. Personal Details  
3. Identification & Bank Details  
4. Education (repeatable)  
5. Employment History (fresher/experienced)  
6. Professional Summary  
7. IT & Asset Requirements  
8. Document Upload  
9. Policy Acknowledgements & Signatures  
10. Review & Submit  

## HR-Only Fields

Managed in the admin employee detail view (not shown to joinees):

- **Induction Checklist** — HR Orientation, IT Setup, Email, ID Card, Payroll, Attendance, Dept Induction, Safety
- **IT Asset Allocation** — Asset, Asset ID, Condition, Employee Acknowledgement

## Deployment (Vercel)

1. Push to GitHub and import in Vercel
2. Add a PostgreSQL database (Vercel Postgres or Neon)
3. Set all environment variables in Vercel project settings
4. Run `npx prisma migrate deploy` via build command or CI
5. Deploy

Add to `package.json` build script if needed:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

## Project Structure

```
src/
├── app/                    # App Router pages & API routes
├── components/
│   ├── admin/              # HR dashboard components
│   ├── onboarding/         # Multi-step wizard
│   └── ui/                 # Shared UI primitives
├── lib/
│   ├── validations/        # Zod schemas
│   ├── auth.ts             # NextAuth config
│   ├── encryption.ts       # AES-256 field encryption
│   ├── onboarding-service.ts
│   ├── pdf.ts              # PDF & CSV export
│   └── email.ts            # Resend integration
prisma/
├── schema.prisma
└── seed.ts
uploads/                    # Local file storage (gitignored)
```

## License

Private — UCBS internal use.
