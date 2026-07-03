"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut } from "lucide-react";

export function AdminHeader({
  userName,
  title,
  breadcrumb,
}: {
  userName: string;
  title?: string;
  breadcrumb?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 min-h-[5rem]">
        <div className="flex items-center gap-6 min-w-0">
          <BrandLogo />
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="hidden sm:block min-w-0">
            {breadcrumb && (
              <Link
                href="/admin/dashboard"
                className="text-xs text-slate-500 hover:text-[#1e3a5f] flex items-center gap-1"
              >
                <LayoutDashboard className="h-3 w-3" /> Dashboard
              </Link>
            )}
            {title && (
              <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block text-right">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-900">{userName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
