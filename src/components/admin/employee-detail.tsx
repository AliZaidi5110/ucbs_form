"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminHeader } from "./admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { INDUCTION_ITEMS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { OnboardingFormData } from "@/lib/validations/onboarding";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Employee = {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  status: string;
  dateOfJoining: string;
  hrRemarks: string | null;
  officialEmail: string | null;
  submittedAt: string | null;
  inductionChecklist: Record<string, boolean | string | null> | null;
  itAssetAllocations: Array<{
    id: string;
    asset: string;
    assetId: string;
    condition: string | null;
    employeeAck: boolean;
  }>;
};

export function EmployeeDetail({
  employee,
  formData,
  userName,
}: {
  employee: Employee;
  formData: OnboardingFormData;
  userName: string;
}) {
  const [status, setStatus] = useState(employee.status);
  const [officialEmail, setOfficialEmail] = useState(employee.officialEmail || "");
  const [hrRemarks, setHrRemarks] = useState(employee.hrRemarks || "");
  const [induction, setInduction] = useState<Record<string, boolean | string>>(
    () => {
      const init: Record<string, boolean | string> = {};
      INDUCTION_ITEMS.forEach((item) => {
        init[item.key] = !!(employee.inductionChecklist?.[item.key]);
        init[item.remarksKey] = String(employee.inductionChecklist?.[item.remarksKey] || "");
      });
      return init;
    }
  );
  const [assets, setAssets] = useState(
    employee.itAssetAllocations.length
      ? employee.itAssetAllocations
      : [{ id: "new", asset: "", assetId: "", condition: "", employeeAck: false }]
  );
  const [saving, setSaving] = useState(false);

  const save = async (extra?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const inductionChecklist: Record<string, boolean | string | null> = {};
      INDUCTION_ITEMS.forEach((item) => {
        inductionChecklist[item.key] = !!induction[item.key];
        inductionChecklist[item.remarksKey] = String(induction[item.remarksKey] || "");
      });

      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          officialEmail,
          hrRemarks,
          inductionChecklist,
          itAssetAllocations: assets.filter((a) => a.asset && a.assetId),
          ...extra,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved successfully");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resendLink = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend-link" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success("Link resent!");
      navigator.clipboard.writeText(data.onboardingUrl);
    } catch {
      toast.error("Failed to resend link");
    } finally {
      setSaving(false);
    }
  };

  const reopen = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      if (!res.ok) throw new Error();
      setStatus("IN_PROGRESS");
      toast.success("Form reopened for edits");
    } catch {
      toast.error("Failed to reopen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader userName={userName} title={employee.fullName} />
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          <div className="ml-auto flex gap-2">
            <a href={`/api/admin/employees/${employee.id}?format=pdf`}>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Export PDF
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={resendLink} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-1" /> Resend Link
            </Button>
            {(status === "SUBMITTED" || status === "VERIFIED") && (
              <Button variant="outline" size="sm" onClick={reopen} disabled={saving}>
                Reopen for Edits
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Section title="Basic Details">
              <Field label="Employee ID" value={formData.basic.employeeId} />
              <Field label="Name" value={formData.basic.fullName} />
              <Field label="Department" value={formData.basic.department} />
              <Field label="Designation" value={formData.basic.designation} />
              <Field label="Date of Joining" value={formData.basic.dateOfJoining} />
              <Field label="Official Email" value={formData.basic.officialEmail || "Pending HR assignment"} />
              <Field label="Mobile" value={formData.basic.mobileNumber} />
            </Section>

            <Section title="Personal Details">
              <Field label="DOB" value={formData.personal.dateOfBirth} />
              <Field label="Gender" value={formData.personal.gender} />
              <Field label="Address" value={formData.personal.currentAddress} />
              <Field label="Emergency" value={`${formData.personal.emergencyContactName} — ${formData.personal.emergencyContactPhone}`} />
            </Section>

            <Section title="Documents">
              {formData.documents.uploads.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded</p>
              ) : (
                formData.documents.uploads.map((d) => (
                  <a
                    key={d.fileKey}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    {d.fileName} ({d.documentType})
                  </a>
                ))
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-white p-4 space-y-3">
              <h3 className="font-semibold">Assign Official Email</h3>
              <p className="text-xs text-slate-500">
                Set the company email address for this employee. It will appear read-only on their onboarding form.
              </p>
              <Input
                type="email"
                placeholder="firstname.lastname@ucbs.com"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
              />
              {officialEmail && (
                <p className="text-xs text-emerald-700">
                  Assigned: {officialEmail}
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 space-y-3">
              <h3 className="font-semibold">Status & Remarks</h3>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="HR remarks..."
                value={hrRemarks}
                onChange={(e) => setHrRemarks(e.target.value)}
                rows={3}
              />
              {employee.submittedAt && (
                <p className="text-xs text-slate-500">
                  Submitted: {formatDate(employee.submittedAt)}
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 space-y-3">
              <h3 className="font-semibold">Induction Checklist</h3>
              {INDUCTION_ITEMS.map((item) => (
                <div key={item.key} className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!induction[item.key]}
                      onCheckedChange={(c) =>
                        setInduction((prev) => ({ ...prev, [item.key]: !!c }))
                      }
                    />
                    {item.label}
                  </label>
                  <Input
                    placeholder="Remarks"
                    className="text-xs"
                    value={String(induction[item.remarksKey] || "")}
                    onChange={(e) =>
                      setInduction((prev) => ({ ...prev, [item.remarksKey]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-white p-4 space-y-3">
              <h3 className="font-semibold">IT Asset Allocation</h3>
              {assets.map((asset, i) => (
                <div key={asset.id || i} className="space-y-2 border-b pb-2">
                  <Input
                    placeholder="Asset"
                    value={asset.asset}
                    onChange={(e) => {
                      const next = [...assets];
                      next[i] = { ...next[i], asset: e.target.value };
                      setAssets(next);
                    }}
                  />
                  <Input
                    placeholder="Asset ID"
                    value={asset.assetId}
                    onChange={(e) => {
                      const next = [...assets];
                      next[i] = { ...next[i], assetId: e.target.value };
                      setAssets(next);
                    }}
                  />
                  <Input
                    placeholder="Condition"
                    value={asset.condition || ""}
                    onChange={(e) => {
                      const next = [...assets];
                      next[i] = { ...next[i], condition: e.target.value };
                      setAssets(next);
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setAssets([
                    ...assets,
                    { id: `new-${Date.now()}`, asset: "", assetId: "", condition: "", employeeAck: false },
                  ])
                }
              >
                Add Asset
              </Button>
            </div>

            <Button className="w-full" onClick={() => save()} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}
