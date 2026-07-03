"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminHeader } from "./admin-header";
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, StatCard } from "@/components/ui/card";
import { DEPARTMENTS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Download, Eye, Plus, Search, Users } from "lucide-react";
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
  tokens: { token: string }[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminDashboard({ userName }: { userName: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    if (status) params.set("status", status);

    const res = await fetch(`/api/admin/employees?${params}`);
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, [search, department, status]);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const stats = useMemo(() => ({
    total: employees.length,
    submitted: employees.filter((e) => e.status === "SUBMITTED" || e.status === "VERIFIED").length,
    inProgress: employees.filter((e) => e.status === "IN_PROGRESS").length,
    invited: employees.filter((e) => e.status === "INVITED").length,
  }), [employees]);

  const handleCreated = (data: { onboardingUrl: string }) => {
    setShowCreate(false);
    fetchEmployees();
    toast.success("Employee invited! Onboarding link copied to clipboard.");
    navigator.clipboard.writeText(data.onboardingUrl).catch(() => {});
  };

  return (
    <>
      <AdminHeader userName={userName} title="HR Dashboard" />
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employee Onboarding</h1>
            <p className="text-sm text-slate-600 mt-1">
              Invite new joinees, track submissions, and manage induction.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/admin/export/csv">
              <Button variant="outline">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </a>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Invite Employee
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Employees" value={stats.total} hint="All records" />
          <StatCard label="Submitted" value={stats.submitted} hint="Ready for review" className="border-emerald-100" />
          <StatCard label="In Progress" value={stats.inProgress} hint="Form partially filled" className="border-amber-100" />
          <StatCard label="Invited" value={stats.invited} hint="Awaiting start" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name or employee ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={department || "all"} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joining</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-700">No employees found</p>
                      <p className="text-sm text-slate-500 mt-1">Invite your first employee to get started.</p>
                      <Button className="mt-4" size="sm" onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4" /> Invite Employee
                      </Button>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eef5] text-xs font-semibold text-[#1e3a5f]">
                            {initials(emp.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{emp.fullName}</p>
                            <p className="text-xs text-slate-500">{emp.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{emp.employeeId}</td>
                      <td className="px-5 py-4 text-slate-600">{emp.department}</td>
                      <td className="px-5 py-4">
                        <Badge className={STATUS_COLORS[emp.status]}>
                          {STATUS_LABELS[emp.status] || emp.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(emp.dateOfJoining)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/admin/employees/${emp.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateEmployeeDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </>
  );
}
