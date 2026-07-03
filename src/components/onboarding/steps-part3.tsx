"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "./form-field";
import type { OnboardingFormData } from "@/lib/validations/onboarding";

const POLICY_ITEMS = [
  { key: "understoodPolicies", label: "I have understood the company policies" },
  { key: "maintainConfidentiality", label: "I will maintain confidentiality of company information" },
  { key: "agreeCompanyRules", label: "I agree to abide by company rules and regulations" },
  { key: "understandAttendancePolicy", label: "I understand the attendance and leave policy" },
  { key: "receivedSafetyInfo", label: "I have received workplace safety information" },
  { key: "agreeCodeOfConduct", label: "I agree to the Code of Conduct" },
  { key: "acknowledgeNda", label: "I acknowledge the Non-Disclosure Agreement (NDA)" },
  { key: "agreeAssetHandling", label: "I agree to asset handling terms and conditions" },
] as const;

export function StepAcknowledgements({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { register, watch, setValue, formState: { errors } } = form;
  const today = new Date().toLocaleDateString("en-IN");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {POLICY_ITEMS.map((item) => (
          <label key={item.key} className="flex items-start gap-3 text-sm">
            <Checkbox
              disabled={readOnly}
              checked={!!watch(`acknowledgements.${item.key}`)}
              onCheckedChange={(c) =>
                setValue(`acknowledgements.${item.key}`, !!c, { shouldDirty: true })
              }
              className="mt-0.5"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <hr className="border-slate-200" />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Declaration — Type full name"
          required
          error={errors.acknowledgements?.declarationSignature?.message}
        >
          <Input {...register("acknowledgements.declarationSignature")} readOnly={readOnly} />
          <p className="text-xs text-slate-500 mt-1">Date: {today}</p>
        </FormField>
        <FormField label="NDA — Type full name" required error={errors.acknowledgements?.ndaSignature?.message}>
          <Input {...register("acknowledgements.ndaSignature")} readOnly={readOnly} />
          <p className="text-xs text-slate-500 mt-1">Date: {today}</p>
        </FormField>
        <FormField
          label="Code of Conduct — Type full name"
          required
          error={errors.acknowledgements?.codeOfConductSignature?.message}
        >
          <Input {...register("acknowledgements.codeOfConductSignature")} readOnly={readOnly} />
          <p className="text-xs text-slate-500 mt-1">Date: {today}</p>
        </FormField>
      </div>
    </div>
  );
}

export function StepReview({
  form,
  onEdit,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  onEdit?: (step: number) => void;
  readOnly?: boolean;
}) {
  const data = form.getValues();

  const sections = [
    { step: 1, title: "Basic Details", content: data.basic.fullName },
    { step: 2, title: "Personal Details", content: `${data.personal.nationality} · DOB: ${data.personal.dateOfBirth}` },
    { step: 3, title: "ID & Bank", content: `PAN: ${data.identification.panNumber}` },
    { step: 4, title: "Education", content: `${data.education.entries.length} record(s)` },
    {
      step: 5,
      title: "Employment",
      content: data.employment.isFresher
        ? "Fresher"
        : `${data.employment.entries.length} record(s)`,
    },
    { step: 6, title: "Professional", content: data.professional.keySkills.join(", ") || "—" },
    { step: 7, title: "Documents", content: `${data.documents.uploads.length} file(s) uploaded` },
    { step: 8, title: "Acknowledgements", content: "All policies acknowledged" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 mb-4">
        Please review your information before submitting. Use Edit to make changes.
      </p>
      {sections.map((s) => (
        <div
          key={s.step}
          className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{s.title}</p>
            <p className="text-sm text-slate-600">{s.content}</p>
          </div>
          {!readOnly && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(s.step)}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
