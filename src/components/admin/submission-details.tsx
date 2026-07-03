"use client";

import type { OnboardingFormData } from "@/lib/validations/onboarding";
import { DOCUMENT_TYPES } from "@/lib/constants";
import {
  DetailGrid,
  DetailItem,
  DetailSection,
  EmptyState,
} from "@/components/shared/detail-view";
import { FileText, ExternalLink } from "lucide-react";

export function SubmissionDetails({ data }: { data: OnboardingFormData }) {
  const docLabel = (key: string) =>
    DOCUMENT_TYPES.find((d) => d.key === key)?.label || key;

  return (
    <div className="space-y-5">
      <DetailSection title="Basic Details" description="Employee identity and contact information">
        <DetailGrid>
          <DetailItem label="Employee ID" value={data.basic.employeeId} mono />
          <DetailItem label="Full Name" value={data.basic.fullName} />
          <DetailItem label="Date of Joining" value={data.basic.dateOfJoining} />
          <DetailItem label="Work Location" value={data.basic.workLocation} />
          <DetailItem label="Reporting Manager" value={data.basic.reportingManager} />
          <DetailItem
            label="Official Email"
            value={data.basic.officialEmail || "Pending HR assignment"}
          />
          <DetailItem label="Personal Email" value={data.basic.personalEmail} />
          <DetailItem label="Mobile" value={data.basic.mobileNumber} mono />
          <DetailItem label="Alternate Mobile" value={data.basic.alternateMobile} mono />
          {data.basic.photographUrl && (
            <DetailItem label="Personal Photo" value="Uploaded" />
          )}
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Personal Details">
        <DetailGrid>
          <DetailItem label="Date of Birth" value={data.personal.dateOfBirth} />
          <DetailItem label="Gender" value={data.personal.gender.replace(/_/g, " ")} />
          <DetailItem label="Marital Status" value={data.personal.maritalStatus} />
          <DetailItem label="Blood Group" value={data.personal.bloodGroup} />
          <DetailItem label="Nationality" value={data.personal.nationality} />
          <DetailItem label="Current Address" value={data.personal.currentAddress} fullWidth />
          <DetailItem label="Permanent Address" value={data.personal.permanentAddress} fullWidth />
          <DetailItem label="Emergency Contact" value={data.personal.emergencyContactName} />
          <DetailItem label="Emergency Phone" value={data.personal.emergencyContactPhone} mono />
          <DetailItem label="Relationship" value={data.personal.emergencyRelationship} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Identification & Bank Details">
        <DetailGrid>
          <DetailItem label="Aadhaar" value={data.identification.aadhaarNumber || "—"} mono />
          <DetailItem label="PAN" value={data.identification.panNumber} mono />
          <DetailItem label="UAN" value={data.identification.uan} />
          <DetailItem label="ESIC" value={data.identification.esic} />
          <DetailItem label="Bank Name" value={data.identification.bankName} />
          <DetailItem label="Account Holder" value={data.identification.accountHolderName} />
          <DetailItem label="Account Number" value={maskId(data.identification.accountNumber, 4)} mono />
          <DetailItem label="IFSC" value={data.identification.ifscCode} mono />
          <DetailItem label="Branch" value={data.identification.branch} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Education">
        {data.education.entries.length === 0 ? (
          <EmptyState message="No education records provided" />
        ) : (
          <div className="space-y-3">
            {data.education.entries.map((e, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4 bg-slate-50/50">
                <p className="text-sm font-medium text-slate-900">{e.qualification}</p>
                <p className="text-sm text-slate-600">{e.institution} · {e.year} · {e.percentage}</p>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Employment History">
        {data.employment.isFresher ? (
          <EmptyState message="Fresher — no prior employment" />
        ) : data.employment.entries.length === 0 ? (
          <EmptyState message="No employment history provided" />
        ) : (
          <div className="space-y-3">
            {data.employment.entries.map((e, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-4 bg-slate-50/50">
                <p className="text-sm font-medium text-slate-900">{e.company}</p>
                <p className="text-sm text-slate-600">{e.designation}</p>
                <p className="text-xs text-slate-500 mt-1">{e.fromDate} — {e.toDate}</p>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Professional Summary">
        <DetailGrid>
          <DetailItem label="Key Skills" value={data.professional.keySkills.join(", ")} fullWidth />
          <DetailItem label="Total Experience" value={data.professional.totalYearsExperience} />
          <DetailItem label="Industry Experience" value={data.professional.relevantIndustryExperience} />
          <DetailItem label="Achievements" value={data.professional.majorAchievements} fullWidth />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Documents">
        {data.documents.uploads.length === 0 ? (
          <EmptyState message="No documents uploaded yet" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.documents.uploads.map((d) => (
              <a
                key={d.fileKey}
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm hover:border-[#1e3a5f]/30 hover:bg-[#e8eef5] transition-colors group"
              >
                <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#1e3a5f]" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{docLabel(d.documentType)}</p>
                  <p className="text-xs text-slate-500 truncate">{d.fileName}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Acknowledgements & Signatures">
        <DetailGrid>
          <DetailItem label="Declaration Signature" value={data.acknowledgements.declarationSignature} />
          <DetailItem label="NDA Signature" value={data.acknowledgements.ndaSignature} />
          <DetailItem label="Code of Conduct Signature" value={data.acknowledgements.codeOfConductSignature} />
        </DetailGrid>
      </DetailSection>
    </div>
  );
}

function maskId(value: string | undefined, visible = 4) {
  if (!value) return "—";
  if (!value) return "—";
  if (value.length <= visible) return "*".repeat(value.length);
  return "*".repeat(value.length - visible) + value.slice(-visible);
}
