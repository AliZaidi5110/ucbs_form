"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { StepIndicator } from "./step-indicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { PortalFooter, PortalHeader } from "@/components/shared/portal-shell";
import { HelpBanner } from "./form-field";
import { ONBOARDING_STEPS } from "@/lib/constants";
import {
  onboardingFormSchema,
  stepSchemas,
  normalizeDocumentUploads,
  type OnboardingFormData,
} from "@/lib/validations/onboarding";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/constants";
import { StepBasic, StepPersonal, StepIdentification } from "./steps-part1";
import {
  StepEducation,
  StepEmployment,
  StepProfessional,
  StepDocuments,
} from "./steps-part2";
import { StepAcknowledgements, StepReview } from "./steps-part3";
import { CheckCircle2, ChevronLeft, ChevronRight, Cloud, Eye, Loader2 } from "lucide-react";

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

  const saveStep = useCallback(
    async (stepNum: number, data: OnboardingFormData) => {
      if (readOnly) return;
      const sectionKeys: Record<number, keyof OnboardingFormData> = {
        1: "basic", 2: "personal", 3: "identification", 4: "education",
        5: "employment", 6: "professional", 7: "documents", 8: "acknowledgements",
      };
      const key = sectionKeys[stepNum];
      if (!key) return;
      await fetch(`/api/onboard/${token}/steps/${stepNum}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepData: data[key], fullDraft: data }),
      });
    },
    [token, readOnly]
  );

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
        toast.error("Could not save your progress. Please check your connection.");
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
      timer = setTimeout(() => saveDraft(data as OnboardingFormData), 1500);
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
      1: "basic", 2: "personal", 3: "identification", 4: "education",
      5: "employment", 6: "professional", 7: "documents", 8: "acknowledgements",
    };
    const key = sectionKeys[stepNum];

    if (stepNum === 7) {
      REQUIRED_DOCUMENT_TYPES.forEach((type) => {
        form.clearErrors(`documents.${type}` as Parameters<typeof form.clearErrors>[0]);
      });
      form.clearErrors("documents.uploads");
    }

    let sectionData = form.getValues()[key];

    if (stepNum === 7) {
      const docData = form.getValues("documents");
      const normalized = normalizeDocumentUploads(docData.uploads || []);
      form.setValue("documents.uploads", normalized, { shouldValidate: false });
      sectionData = { uploads: normalized };
    }

    const result = schema.safeParse(sectionData);
    if (!result.success) {
      let hasDocumentFieldError = false;
      result.error.issues.forEach((issue) => {
        const pathParts = issue.path.filter(Boolean);
        const path =
          pathParts.length > 0
            ? (`${key}.${pathParts.join(".")}` as Parameters<typeof form.setError>[0])
            : (`${key}.uploads` as Parameters<typeof form.setError>[0]);
        form.setError(path, { message: issue.message });
        if (stepNum === 7 && pathParts.length === 1 && REQUIRED_DOCUMENT_TYPES.includes(pathParts[0] as typeof REQUIRED_DOCUMENT_TYPES[number])) {
          hasDocumentFieldError = true;
        }
      });
      if (!hasDocumentFieldError && stepNum === 7) {
        toast.error("Please upload all required documents highlighted below");
      } else if (stepNum !== 7) {
        toast.error("Please complete the required fields highlighted below");
      }
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (readOnly) {
      setStep((s) => Math.min(s + 1, 9));
      return;
    }
    if (!(await validateStep(step))) return;
    const values = form.getValues();
    await saveStep(step, values);
    await saveDraft(values);
    setStep((s) => Math.min(s + 1, 9));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!(await form.trigger())) {
      toast.error("Please review and complete all required sections");
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
      toast.success("Your onboarding form has been submitted!");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = typeof body.error === "string" ? body.error : `Upload failed (${res.status})`;
        console.error("[onboarding upload]", { documentType, status: res.status, body });
        toast.error(msg);
        return;
      }

      const record = {
        documentType: body.documentType || documentType,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileKey: body.fileKey,
        mimeType: body.mimeType,
      };

      const current = normalizeDocumentUploads(form.getValues("documents.uploads") || []);
      form.setValue(
        "documents.uploads",
        [...current.filter((u) => u.documentType !== documentType), record],
        { shouldDirty: true, shouldValidate: true }
      );

      form.clearErrors(`documents.${documentType}` as Parameters<typeof form.clearErrors>[0]);

      if (documentType === "photo") {
        form.setValue("basic.photographUrl", record.fileUrl, { shouldDirty: true });
      }

      toast.success("Document uploaded successfully");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      console.error("[onboarding upload]", error);
      toast.error(msg);
    } finally {
      setUploading(null);
    }
  };

  const currentStepMeta = ONBOARDING_STEPS[step - 1];

  if (submitted && !readOnly) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PortalHeader title="Onboarding Complete" subtitle={`Welcome, ${employeeName}`} />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="py-12 space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
                <p className="text-slate-600 mt-2">
                  Your onboarding form has been submitted successfully, {employeeName.split(" ")[0]}.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-left text-sm text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">What happens next?</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>HR will review your submission</li>
                  <li>You may be contacted for additional documents</li>
                  <li>Your official email will be assigned by HR</li>
                  <li>Revisit this link anytime to view your submitted data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
        <PortalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PortalHeader
        title={`Welcome, ${employeeName}`}
        subtitle="Employee Onboarding Form"
        badge={
          readOnly ? (
            <Badge className="bg-blue-100 text-blue-800">
              <Eye className="h-3 w-3 mr-1" /> View Only
            </Badge>
          ) : saving ? (
            <Badge className="bg-slate-100 text-slate-600">
              <Cloud className="h-3 w-3 mr-1" /> Saving...
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-700">
              <Cloud className="h-3 w-3 mr-1" /> Auto-saved
            </Badge>
          )
        }
      />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
        {!readOnly && step === 1 && (
          <HelpBanner>
            Take your time — your progress is saved automatically. You can close this page and return anytime using the same link.
          </HelpBanner>
        )}

        <StepIndicator currentStep={step} readOnly={readOnly} onStepClick={(s) => setStep(s)} />

        <Card>
          <CardHeader>
            <CardTitle>{currentStepMeta?.title}</CardTitle>
            <CardDescription>{currentStepMeta?.hint}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && <StepBasic form={form} readOnly={readOnly} uploading={!!uploading} onPhotoUpload={(f) => handleUpload("photo", f)} />}
            {step === 2 && <StepPersonal form={form} readOnly={readOnly} />}
            {step === 3 && <StepIdentification form={form} readOnly={readOnly} />}
            {step === 4 && <StepEducation form={form} readOnly={readOnly} />}
            {step === 5 && <StepEmployment form={form} readOnly={readOnly} />}
            {step === 6 && <StepProfessional form={form} readOnly={readOnly} />}
            {step === 7 && <StepDocuments form={form} readOnly={readOnly} uploading={uploading} onUpload={handleUpload} />}
            {step === 8 && <StepAcknowledgements form={form} readOnly={readOnly} />}
            {step === 9 && <StepReview form={form} readOnly={readOnly} onEdit={(s) => setStep(s)} />}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <Button type="button" variant="outline" disabled={step === 1} onClick={() => { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {step < 9 ? (
                <Button type="button" onClick={handleNext}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                !readOnly && (
                  <Button type="button" size="lg" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Submitting..." : "Submit Onboarding Form"}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <PortalFooter />
    </div>
  );
}
