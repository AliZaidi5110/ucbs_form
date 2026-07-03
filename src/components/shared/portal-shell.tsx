import { BrandLogo } from "./brand-logo";
import { cn } from "@/lib/utils";

export function PortalHeader({
  title,
  subtitle,
  badge,
  className,
}: {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-slate-200 bg-white shadow-sm", className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 min-h-[5rem]">
        <BrandLogo />
        {(title || subtitle) && (
          <div className="hidden sm:block text-right">
            {title && <p className="text-sm font-medium text-slate-900">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        )}
        {badge}
      </div>
    </header>
  );
}

export function PortalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} UCBS Human Resources · Secure Employee Onboarding
      </div>
    </footer>
  );
}
