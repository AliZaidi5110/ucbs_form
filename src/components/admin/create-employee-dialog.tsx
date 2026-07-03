"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEPARTMENTS, WORK_LOCATIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateEmployeeDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (data: { onboardingUrl: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    fullName: "",
    department: "",
    designation: "",
    reportingManager: "",
    dateOfJoining: "",
    workLocation: "",
    officialEmail: "",
    personalEmail: "",
    mobileNumber: "",
  });

  if (!open) return null;

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create employee");
      const data = await res.json();
      onCreated(data);
      setForm({
        employeeId: "",
        fullName: "",
        department: "",
        designation: "",
        reportingManager: "",
        dateOfJoining: "",
        workLocation: "",
        officialEmail: "",
        personalEmail: "",
        mobileNumber: "",
      });
    } catch {
      alert("Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Invite New Employee</h2>
          <p className="text-sm text-slate-600 mt-1">Create a record and send a secure onboarding link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input
                value={form.employeeId}
                onChange={(e) => update("employeeId", e.target.value.toUpperCase())}
                placeholder="Leave blank to auto-generate (UCBS-2026-0001)"
              />
              <p className="text-xs text-slate-500">Must start with UCBS- if entered manually.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={(v) => update("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation *</Label>
              <Input value={form.designation} onChange={(e) => update("designation", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Reporting Manager</Label>
              <Input value={form.reportingManager} onChange={(e) => update("reportingManager", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Joining *</Label>
              <Input type="date" value={form.dateOfJoining} onChange={(e) => update("dateOfJoining", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Work Location *</Label>
              <Select value={form.workLocation} onValueChange={(v) => update("workLocation", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {WORK_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Assign Official Email</Label>
              <Input
                type="email"
                value={form.officialEmail}
                onChange={(e) => update("officialEmail", e.target.value)}
                placeholder="e.g. firstname.lastname@ucbs.com"
              />
              <p className="text-xs text-slate-500">
                HR assigns the company email. You can set it now or later from the employee record.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Personal Email</Label>
              <Input type="email" value={form.personalEmail} onChange={(e) => update("personalEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile Number *</Label>
              <Input
                value={form.mobileNumber}
                onChange={(e) => update("mobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                maxLength={10}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create & Send Link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
