"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function FormField({
  label,
  error,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-xs text-slate-500 -mt-0.5">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/30 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function HelpBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
      {children}
    </div>
  );
}
