"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { StepIndicator } from "./step-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/lib/constants";
import {
  onboardingFormSchema,
  stepSchemas,
  type OnboardingFormData,
} from "@/lib/validations/onboarding";
import { StepBasic, StepPersonal, StepIdentification } from "./steps-part1";
import {
  StepEducation,
  StepEmployment,
  StepProfessional,
  StepDocuments,
} from "./steps-part2";
import { StepAcknowledgements, StepReview } from "./steps-part3";
import { CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  token: string;
  initialData: OnboardingFormData;
  readOnly: boolean;
  status: string;
  employeeName: string;
};

export function OnboardingWizard({ token, initialData, readOnly, status, employeeName }: Props) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(status === "SUBMITTED" || status === "VERIFIED");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const form = useForm<OnboardingFormData>({
    defaultValues: initialData,
    resolver: zodResolver(onboardingFormSchema),
    mode: "onBlur",
  });

  const saveDraft = useCallback(
    async (data: OnboardingFormData) => {
      if (readOnly) return;
      setSaving(true);
      try {
        await fetch(`/api/onboard/${token}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        toast.error("Failed to save draft");
      } finally {
        setSaving(false);
      }
    },
    [token, readOnly]
  );

  useEffect(() => {
    if (readOnly) return;
    let timer: ReturnType<typeof setTimeout>;
    const subscription = form.watch((data) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveDraft(data as OnboardingFormData);
      }, 1500);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [form, saveDraft, readOnly]);

  const validateStep = async (stepNum: number): Promise<boolean> => {
    const schema = stepSchemas[stepNum as keyof typeof stepSchemas];
    if (!schema) return true;
    const sectionKeys: Record<number, keyof OnboardingFormData> = {
      1: "basic",
      2: "personal",
      3: "identification",
      4: "education",
      5: "employment",
      6: "professional",
      7: "documents",
      8: "acknowledgements",
    };
    const key = sectionKeys[stepNum];
    const result = schema.safeParse(form.getValues()[key]);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = `${key}.${issue.path.join(".")}` as Parameters<typeof form.setError>[0];
        form.setError(path, { message: issue.message });
      });
      toast.error("Please fix the errors before continuing");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (readOnly) {
      setStep((s) => Math.min(s + 1, 9));
      return;
    }
    const valid = await validateStep(step);
    if (!valid) return;
    await saveDraft(form.getValues());
    setStep((s) => Math.min(s + 1, 9));
  };

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please complete all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/onboard/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.getValues()),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      setSubmitted(true);
      toast.success("Onboarding form submitted successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", documentType);
      const res = await fetch(`/api/onboard/${token}/upload`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const uploaded = await res.json();
      const current = form.getValues("documents.uploads");
      const filtered = current.filter((u) => u.documentType !== documentType);
      form.setValue("documents.uploads", [...filtered, uploaded], { shouldDirty: true });
      if (documentType === "photo") {
        form.setValue("basic.photographUrl", uploaded.fileUrl, { shouldDirty: true });
      }
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (submitted && !readOnly) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-slate-900">Submission Complete</h2>
          <p className="text-slate-600">
            Thank you, {employeeName}! Your onboarding form has been submitted successfully.
          </p>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 text-left max-w-md mx-auto">
            <p className="font-medium text-slate-800 mb-2">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>HR will review your submission</li>
              <li>You may be contacted for additional documents</li>
              <li>HR will process your onboarding and induction</li>
              <li>You can revisit this link anytime to view your submitted data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stepTitle = ONBOARDING_STEPS[step - 1]?.title;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">UCBS Employee Onboarding</h1>
        <p className="text-sm text-slate-600">
          Welcome, {employeeName}
          {readOnly && " — View only"}
        </p>
      </div>

      <StepIndicator
        currentStep={step}
        readOnly={readOnly}
        onStepClick={(s) => setStep(s)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{stepTitle}</CardTitle>
          {saving && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving draft...
            </p>
          )}
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <StepBasic
              form={form}
              readOnly={readOnly}
              uploading={!!uploading}
              onPhotoUpload={(file) => handleUpload("photo", file)}
            />
          )}
          {step === 2 && <StepPersonal form={form} readOnly={readOnly} />}
          {step === 3 && <StepIdentification form={form} readOnly={readOnly} />}
          {step === 4 && <StepEducation form={form} readOnly={readOnly} />}
          {step === 5 && <StepEmployment form={form} readOnly={readOnly} />}
          {step === 6 && <StepProfessional form={form} readOnly={readOnly} />}
          {step === 7 && (
            <StepDocuments
              form={form}
              readOnly={readOnly}
              uploading={uploading}
              onUpload={handleUpload}
            />
          )}
          {step === 8 && <StepAcknowledgements form={form} readOnly={readOnly} />}
          {step === 9 && (
            <StepReview form={form} readOnly={readOnly} onEdit={(s) => setStep(s)} />
          )}

          <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </Button>
            {step < 9 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              !readOnly && (
                <Button type="button" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Submitting..." : "Submit Onboarding Form"}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
