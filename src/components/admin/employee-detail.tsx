"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminHeader } from "./admin-header";
import { SubmissionDetails } from "./submission-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { INDUCTION_ITEMS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { OnboardingFormData } from "@/lib/validations/onboarding";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Mail,
  RefreshCw,
  Settings,
} from "lucide-react";
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
  const [tab, setTab] = useState<"submission" | "hr">("submission");
  const [status, setStatus] = useState(employee.status);
  const [officialEmail, setOfficialEmail] = useState(employee.officialEmail || "");
  const [hrRemarks, setHrRemarks] = useState(employee.hrRemarks || "");
  const [induction, setInduction] = useState<Record<string, boolean | string>>(() => {
    const init: Record<string, boolean | string> = {};
    INDUCTION_ITEMS.forEach((item) => {
      init[item.key] = !!(employee.inductionChecklist?.[item.key]);
      init[item.remarksKey] = String(employee.inductionChecklist?.[item.remarksKey] || "");
    });
    return init;
  });
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
      toast.success("Changes saved successfully");
    } catch {
      toast.error("Failed to save changes");
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
      toast.success("Onboarding link copied to clipboard");
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
      toast.success("Form reopened for employee edits");
    } catch {
      toast.error("Failed to reopen form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader userName={userName} title={employee.fullName} breadcrumb="Dashboard" />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
            <span className="text-sm text-slate-500 font-mono">{employee.employeeId}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/admin/employees/${employee.id}?format=pdf`}>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> PDF
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={resendLink} disabled={saving}>
              <RefreshCw className="h-4 w-4" /> Resend Link
            </Button>
            {(status === "SUBMITTED" || status === "VERIFIED") && (
              <Button variant="outline" size="sm" onClick={reopen} disabled={saving}>
                Reopen Form
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
          {[
            { id: "submission" as const, label: "Submission Details", icon: ClipboardList },
            { id: "hr" as const, label: "HR Actions", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-white text-[#1e3a5f] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "submission" ? (
          <SubmissionDetails data={formData} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <HrPanel title="Assign Official Email" icon={Mail}>
                <p className="text-sm text-slate-600 mb-3">
                  Create and assign the company email. The employee will see it on their onboarding form.
                </p>
                <Input
                  type="email"
                  placeholder="firstname.lastname@ucbs.com"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                />
              </HrPanel>

              <HrPanel title="Status & Remarks">
                <div className="space-y-3">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Internal HR notes about this employee..."
                    value={hrRemarks}
                    onChange={(e) => setHrRemarks(e.target.value)}
                    rows={4}
                  />
                  {employee.submittedAt && (
                    <p className="text-xs text-slate-500">
                      Submitted on {formatDate(employee.submittedAt)}
                    </p>
                  )}
                </div>
              </HrPanel>
            </div>

            <div className="space-y-6">
              <HrPanel title="Induction Checklist">
                <div className="space-y-4">
                  {INDUCTION_ITEMS.map((item) => (
                    <div key={item.key} className="rounded-lg border border-slate-100 p-3 bg-slate-50/50">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                          checked={!!induction[item.key]}
                          onCheckedChange={(c) =>
                            setInduction((prev) => ({ ...prev, [item.key]: !!c }))
                          }
                        />
                        {item.label}
                      </label>
                      <Input
                        placeholder="Remarks (optional)"
                        className="mt-2 text-sm"
                        value={String(induction[item.remarksKey] || "")}
                        onChange={(e) =>
                          setInduction((prev) => ({ ...prev, [item.remarksKey]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </HrPanel>

              <HrPanel title="IT Asset Allocation">
                <div className="space-y-3">
                  {assets.map((asset, i) => (
                    <div key={asset.id || i} className="grid gap-2 rounded-lg border border-slate-100 p-3 bg-slate-50/50">
                      <Input placeholder="Asset name" value={asset.asset} onChange={(e) => {
                        const next = [...assets];
                        next[i] = { ...next[i], asset: e.target.value };
                        setAssets(next);
                      }} />
                      <Input placeholder="Asset ID" value={asset.assetId} onChange={(e) => {
                        const next = [...assets];
                        next[i] = { ...next[i], assetId: e.target.value };
                        setAssets(next);
                      }} />
                      <Input placeholder="Condition" value={asset.condition || ""} onChange={(e) => {
                        const next = [...assets];
                        next[i] = { ...next[i], condition: e.target.value };
                        setAssets(next);
                      }} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() =>
                    setAssets([...assets, { id: `new-${Date.now()}`, asset: "", assetId: "", condition: "", employeeAck: false }])
                  }>
                    Add Asset
                  </Button>
                </div>
              </HrPanel>

              <Button className="w-full" size="lg" onClick={() => save()} disabled={saving}>
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function HrPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        {Icon && <Icon className="h-4 w-4 text-[#1e3a5f]" />}
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
