"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AdminHeader({
  userName,
  title,
}: {
  userName: string;
  title?: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/admin/dashboard" className="text-lg font-semibold text-slate-900">
            UCBS Onboarding
          </Link>
          {title && <p className="text-sm text-slate-600">{title}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{userName}</span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
