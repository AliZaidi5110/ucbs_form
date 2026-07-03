import { cn } from "@/lib/utils";

export function DetailGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
  );
}

export function DetailItem({
  label,
  value,
  fullWidth,
  mono,
}: {
  label: string;
  value?: string | null;
  fullWidth?: boolean;
  mono?: boolean;
}) {
  const display = value?.trim() || "—";
  return (
    <div className={cn("rounded-lg bg-slate-50/80 px-4 py-3 border border-slate-100", fullWidth && "sm:col-span-2")}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">{label}</dt>
      <dd className={cn("text-sm text-slate-900 break-words", mono && "font-mono text-xs")}>{display}</dd>
    </div>
  );
}

export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-slate-500 italic py-2">{message}</p>
  );
}
