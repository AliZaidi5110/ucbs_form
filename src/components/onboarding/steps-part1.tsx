"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField, FormGrid } from "./form-field";
import { WORK_LOCATIONS } from "@/lib/constants";
import type { OnboardingFormData } from "@/lib/validations/onboarding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StepBasic({
  form,
  readOnly,
  onPhotoUpload,
  uploading,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
  onPhotoUpload?: (file: File) => Promise<void>;
  uploading?: boolean;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  const photoUrl = watch("basic.photographUrl");

  return (
    <div className="space-y-6">
      <FormGrid>
        <FormField label="Employee ID" error={errors.basic?.employeeId?.message}>
          <Input {...register("basic.employeeId")} readOnly className="bg-slate-50" />
        </FormField>
        <FormField label="Full Name" required error={errors.basic?.fullName?.message}>
          <Input {...register("basic.fullName")} readOnly={readOnly} />
        </FormField>
        <FormField label="Reporting Manager" error={errors.basic?.reportingManager?.message}>
          <Input {...register("basic.reportingManager")} readOnly={readOnly} />
        </FormField>
        <FormField label="Date of Joining" required error={errors.basic?.dateOfJoining?.message}>
          <Input type="date" {...register("basic.dateOfJoining")} readOnly={readOnly} />
        </FormField>
        <FormField label="Work Location" required error={errors.basic?.workLocation?.message}>
          <Select
            disabled={readOnly}
            value={watch("basic.workLocation")}
            onValueChange={(v) => setValue("basic.workLocation", v, { shouldDirty: true })}
          >
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              {WORK_LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Official Email (assigned by HR)" error={errors.basic?.officialEmail?.message}>
          <Input
            readOnly
            className="bg-slate-50"
            placeholder="Pending — HR will assign your official email"
            value={watch("basic.officialEmail") || ""}
          />
          {!watch("basic.officialEmail") && (
            <p className="text-xs text-slate-500 mt-1">
              Your company email will appear here once HR assigns it.
            </p>
          )}
        </FormField>
        <FormField label="Personal Email" required error={errors.basic?.personalEmail?.message}>
          <Input type="email" {...register("basic.personalEmail")} readOnly={readOnly} />
        </FormField>
        <FormField label="Mobile Number" required error={errors.basic?.mobileNumber?.message}>
          <Input {...register("basic.mobileNumber")} maxLength={10} readOnly={readOnly} />
        </FormField>
        <FormField label="Alternate Mobile" error={errors.basic?.alternateMobile?.message}>
          <Input {...register("basic.alternateMobile")} maxLength={10} readOnly={readOnly} />
        </FormField>
      </FormGrid>

      <FormField label="Photograph">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Employee" className="mb-2 h-24 w-24 rounded-lg object-cover border" />
        )}
        {!readOnly && onPhotoUpload && (
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoUpload(file);
            }}
          />
        )}
      </FormField>
    </div>
  );
}

export function StepPersonal({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { register, setValue, watch, formState: { errors } } = form;
  const sameAsCurrent = watch("personal.sameAsCurrent");
  const currentAddress = watch("personal.currentAddress");
  const gender = watch("personal.gender");

  return (
    <div className="space-y-6">
      <FormGrid>
        <FormField label="Date of Birth" required error={errors.personal?.dateOfBirth?.message}>
          <Input type="date" {...register("personal.dateOfBirth")} readOnly={readOnly} />
        </FormField>
        <FormField label="Gender" required error={errors.personal?.gender?.message}>
          <Select
            disabled={readOnly}
            value={gender}
            onValueChange={(v) =>
              setValue("personal.gender", v as OnboardingFormData["personal"]["gender"], {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
              <SelectItem value="SELF_DESCRIBE">Self-describe</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {gender === "SELF_DESCRIBE" && (
          <FormField label="Please specify">
            <Input {...register("personal.genderSelfDescribe")} readOnly={readOnly} />
          </FormField>
        )}
        <FormField label="Marital Status" required error={errors.personal?.maritalStatus?.message}>
          <Select
            disabled={readOnly}
            value={watch("personal.maritalStatus")}
            onValueChange={(v) =>
              setValue("personal.maritalStatus", v as OnboardingFormData["personal"]["maritalStatus"], {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single</SelectItem>
              <SelectItem value="MARRIED">Married</SelectItem>
              <SelectItem value="DIVORCED">Divorced</SelectItem>
              <SelectItem value="WIDOWED">Widowed</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Blood Group" required error={errors.personal?.bloodGroup?.message}>
          <Input {...register("personal.bloodGroup")} placeholder="e.g. O+" readOnly={readOnly} />
        </FormField>
        <FormField label="Nationality" required error={errors.personal?.nationality?.message}>
          <Input {...register("personal.nationality")} readOnly={readOnly} />
        </FormField>
      </FormGrid>

      <FormField label="Current Address" required error={errors.personal?.currentAddress?.message}>
        <Input {...register("personal.currentAddress")} readOnly={readOnly} />
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly}
          checked={sameAsCurrent}
          onChange={(e) => {
            setValue("personal.sameAsCurrent", e.target.checked, { shouldDirty: true });
            if (e.target.checked) {
              setValue("personal.permanentAddress", currentAddress, { shouldDirty: true });
            }
          }}
        />
        Permanent address same as current
      </label>

      <FormField label="Permanent Address" required error={errors.personal?.permanentAddress?.message}>
        <Input
          {...register("personal.permanentAddress")}
          readOnly={readOnly || sameAsCurrent}
          className={sameAsCurrent ? "bg-slate-50" : ""}
        />
      </FormField>

      <FormGrid>
        <FormField label="Emergency Contact Name" required error={errors.personal?.emergencyContactName?.message}>
          <Input {...register("personal.emergencyContactName")} readOnly={readOnly} />
        </FormField>
        <FormField label="Emergency Contact Number" required error={errors.personal?.emergencyContactPhone?.message}>
          <Input {...register("personal.emergencyContactPhone")} maxLength={10} readOnly={readOnly} />
        </FormField>
        <FormField label="Relationship" required error={errors.personal?.emergencyRelationship?.message}>
          <Input {...register("personal.emergencyRelationship")} readOnly={readOnly} />
        </FormField>
      </FormGrid>
    </div>
  );
}

export function StepIdentification({
  form,
  readOnly,
}: {
  form: UseFormReturn<OnboardingFormData>;
  readOnly?: boolean;
}) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <FormGrid>
        <FormField label="Aadhaar Number" required error={errors.identification?.aadhaarNumber?.message}>
          <Input {...register("identification.aadhaarNumber")} maxLength={12} readOnly={readOnly} />
        </FormField>
        <FormField label="PAN Number" required error={errors.identification?.panNumber?.message}>
          <Input
            {...register("identification.panNumber")}
            maxLength={10}
            className="uppercase"
            readOnly={readOnly}
          />
        </FormField>
        <FormField label="UAN (optional)" error={errors.identification?.uan?.message}>
          <Input {...register("identification.uan")} readOnly={readOnly} />
        </FormField>
        <FormField label="ESIC (optional)" error={errors.identification?.esic?.message}>
          <Input {...register("identification.esic")} readOnly={readOnly} />
        </FormField>
      </FormGrid>

      <hr className="border-slate-200" />

      <FormGrid>
        <FormField label="Bank Name" required error={errors.identification?.bankName?.message}>
          <Input {...register("identification.bankName")} readOnly={readOnly} />
        </FormField>
        <FormField label="Account Holder Name" required error={errors.identification?.accountHolderName?.message}>
          <Input {...register("identification.accountHolderName")} readOnly={readOnly} />
        </FormField>
        <FormField label="Account Number" required error={errors.identification?.accountNumber?.message}>
          <Input {...register("identification.accountNumber")} readOnly={readOnly} />
        </FormField>
        <FormField label="IFSC Code" required error={errors.identification?.ifscCode?.message}>
          <Input {...register("identification.ifscCode")} className="uppercase" readOnly={readOnly} />
        </FormField>
        <FormField label="Branch" required error={errors.identification?.branch?.message}>
          <Input {...register("identification.branch")} readOnly={readOnly} />
        </FormField>
      </FormGrid>
    </div>
  );
}
