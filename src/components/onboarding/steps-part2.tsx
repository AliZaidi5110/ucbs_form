"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormGrid } from "./form-field";
import { ACCESS_OPTIONS, DOCUMENT_ACCEPT, DOCUMENT_FORMAT_HINTS, DOCUMENT_TYPES } from "@/lib/constants";
import type { OnboardingFormData } from "@/lib/validations/onboarding";
import { Plus, Trash2 } from "lucide-react";

export function StepEducation({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { control, register, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "education.entries" });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Education {index + 1}</span>
            {!readOnly && fields.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FormGrid>
            <FormField label="Qualification" required error={errors.education?.entries?.[index]?.qualification?.message}>
              <Input {...register(`education.entries.${index}.qualification`)} readOnly={readOnly} />
            </FormField>
            <FormField label="Institution" required error={errors.education?.entries?.[index]?.institution?.message}>
              <Input {...register(`education.entries.${index}.institution`)} readOnly={readOnly} />
            </FormField>
            <FormField label="Year" required error={errors.education?.entries?.[index]?.year?.message}>
              <Input {...register(`education.entries.${index}.year`)} readOnly={readOnly} />
            </FormField>
            <FormField label="Percentage/CGPA" required error={errors.education?.entries?.[index]?.percentage?.message}>
              <Input {...register(`education.entries.${index}.percentage`)} readOnly={readOnly} />
            </FormField>
          </FormGrid>
        </div>
      ))}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ qualification: "", institution: "", year: "", percentage: "" })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Education
        </Button>
      )}
    </div>
  );
}

export function StepEmployment({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { control, register, watch, setValue, formState: { errors } } = form;
  const isFresher = watch("employment.isFresher");
  const { fields, append, remove } = useFieldArray({ control, name: "employment.entries" });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly}
          checked={isFresher}
          onChange={(e) => setValue("employment.isFresher", e.target.checked, { shouldDirty: true })}
        />
        I am a fresher (no prior employment)
      </label>

      {!isFresher && (
        <>
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Employment {index + 1}</span>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormGrid>
                <FormField label="Company" required>
                  <Input {...register(`employment.entries.${index}.company`)} readOnly={readOnly} />
                </FormField>
                <FormField label="Designation" required>
                  <Input {...register(`employment.entries.${index}.designation`)} readOnly={readOnly} />
                </FormField>
                <FormField label="From">
                  <Input type="date" {...register(`employment.entries.${index}.fromDate`)} readOnly={readOnly} />
                </FormField>
                <FormField label="To">
                  <Input type="date" {...register(`employment.entries.${index}.toDate`)} readOnly={readOnly} />
                </FormField>
                <FormField label="Last Drawn CTC">
                  <Input {...register(`employment.entries.${index}.lastDrawnCtc`)} readOnly={readOnly} />
                </FormField>
                <FormField label="Reason for Leaving">
                  <Input {...register(`employment.entries.${index}.reasonForLeaving`)} readOnly={readOnly} />
                </FormField>
              </FormGrid>
            </div>
          ))}
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  company: "",
                  designation: "",
                  fromDate: "",
                  toDate: "",
                  lastDrawnCtc: "",
                  reasonForLeaving: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add Employment
            </Button>
          )}
          {errors.employment?.entries && (
            <p className="text-xs text-red-600">{errors.employment.entries.message}</p>
          )}
        </>
      )}
    </div>
  );
}

export function StepProfessional({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { register, watch, setValue, formState: { errors } } = form;
  const skills = watch("professional.keySkills") || [];

  return (
    <div className="space-y-4">
      <FormField label="Key Skills" required error={errors.professional?.keySkills?.message}>
        <Input
          placeholder="Type a skill and press Enter"
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = e.currentTarget.value.trim();
              if (val && !skills.includes(val)) {
                setValue("professional.keySkills", [...skills, val], { shouldDirty: true });
                e.currentTarget.value = "";
              }
            }
          }}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs"
            >
              {skill}
              {!readOnly && (
                <button
                  type="button"
                  className="text-slate-500 hover:text-red-600"
                  onClick={() =>
                    setValue(
                      "professional.keySkills",
                      skills.filter((s) => s !== skill),
                      { shouldDirty: true }
                    )
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </FormField>
      <FormGrid>
        <FormField label="Total Years of Experience" required error={errors.professional?.totalYearsExperience?.message}>
          <Input {...register("professional.totalYearsExperience")} readOnly={readOnly} />
        </FormField>
        <FormField label="Relevant Industry Experience">
          <Input {...register("professional.relevantIndustryExperience")} readOnly={readOnly} />
        </FormField>
      </FormGrid>
      <FormField label="Major Achievements">
        <Textarea {...register("professional.majorAchievements")} rows={4} readOnly={readOnly} />
      </FormField>
    </div>
  );
}

export function StepIT({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { register, watch, setValue } = form;
  const accessRequired = watch("it.accessRequired") || [];

  const toggleAccess = (item: string) => {
    const next = accessRequired.includes(item)
      ? accessRequired.filter((a) => a !== item)
      : [...accessRequired, item];
    setValue("it.accessRequired", next, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 rounded border p-3 text-sm">
          <Checkbox
            disabled={readOnly}
            checked={watch("it.laptopRequired")}
            onCheckedChange={(c) => setValue("it.laptopRequired", !!c, { shouldDirty: true })}
          />
          Laptop Required
        </label>
        <label className="flex items-center gap-2 rounded border p-3 text-sm">
          <Checkbox
            disabled={readOnly}
            checked={watch("it.officialEmailNeeded")}
            onCheckedChange={(c) => setValue("it.officialEmailNeeded", !!c, { shouldDirty: true })}
          />
          Official Email Needed
        </label>
        <label className="flex items-center gap-2 rounded border p-3 text-sm">
          <Checkbox
            disabled={readOnly}
            checked={watch("it.simCardRequired")}
            onCheckedChange={(c) => setValue("it.simCardRequired", !!c, { shouldDirty: true })}
          />
          SIM Card Required
        </label>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Access Required</p>
        <div className="grid gap-2 md:grid-cols-2">
          {ACCESS_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <Checkbox
                disabled={readOnly}
                checked={accessRequired.includes(item)}
                onCheckedChange={() => toggleAccess(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {accessRequired.includes("Other") && (
        <FormField label="Other access details">
          <Input {...register("it.accessOther")} readOnly={readOnly} />
        </FormField>
      )}
    </div>
  );
}

export function StepDocuments({
  form,
  readOnly,
  onUpload,
  uploading,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
  onUpload?: (documentType: string, file: File) => Promise<void>;
  uploading?: string | null;
}) {
  const uploads = form.watch("documents.uploads") || [];
  const docErrors = form.formState.errors.documents as
    | Record<string, { message?: string } | undefined>
    | undefined;
  const uploadsError = docErrors?.uploads?.message;

  return (
    <div className="space-y-3">
      {uploadsError && (
        <p className="text-xs text-red-600 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          {uploadsError}
        </p>
      )}
      {DOCUMENT_TYPES.map((doc) => {
        const uploaded = uploads.find((u) => u.documentType === doc.key);
        const accept =
          doc.key in DOCUMENT_ACCEPT
            ? DOCUMENT_ACCEPT[doc.key as keyof typeof DOCUMENT_ACCEPT]
            : undefined;
        const formatHint =
          doc.key in DOCUMENT_FORMAT_HINTS
            ? DOCUMENT_FORMAT_HINTS[doc.key as keyof typeof DOCUMENT_FORMAT_HINTS]
            : "Max 10MB";
        const fieldError = doc.required ? docErrors?.[doc.key]?.message : undefined;

        return (
          <FormField
            key={doc.key}
            label={doc.label}
            required={doc.required}
            hint={formatHint}
            error={fieldError}
            className={fieldError ? "rounded-lg border border-red-200 bg-red-50/40 p-4" : "rounded-lg border border-slate-200 p-4"}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                {!doc.required && (
                  <span className="text-xs text-slate-400">(optional)</span>
                )}
                {uploaded ? (
                  <a
                    href={uploaded.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:underline truncate mt-1"
                  >
                    ✓ {uploaded.fileName}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">No file uploaded yet</p>
                )}
              </div>
              {!readOnly && onUpload && (
                <Input
                  type="file"
                  className="max-w-xs"
                  accept={accept}
                  disabled={uploading === doc.key}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(doc.key, file);
                    e.target.value = "";
                  }}
                />
              )}
            </div>
          </FormField>
        );
      })}
    </div>
  );
}
