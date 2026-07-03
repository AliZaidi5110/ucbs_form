import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { PortalFooter } from "@/components/shared/portal-shell";
import { ArrowRight, ClipboardList, MousePointer2, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <BrandLogo />
          <Link href="/admin/login">
            <Button variant="outline" size="sm">HR Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-[#1e3a5f] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-3">
                UCBS Human Resources
              </p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Employee Onboarding Portal
              </h1>
              <p className="mt-4 text-lg text-blue-100/90 leading-relaxed">
                A secure, guided onboarding experience. Complete your profile, upload documents,
                and sign acknowledgements — all in one place.
              </p>
              <div className="mt-10 relative inline-block">
                <Link href="/try" className="block">
                  <Button
                    size="lg"
                    className="relative w-full sm:w-auto min-w-[240px] cursor-pointer bg-white text-[#1e3a5f] hover:bg-blue-50 shadow-lg ring-2 ring-white/40 ring-offset-2 ring-offset-[#1e3a5f] pr-12"
                  >
                    Start Onboarding <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <MousePointer2
                  className="absolute bottom-1 right-3 h-8 w-8 text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] animate-bounce pointer-events-none z-10"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: ClipboardList,
                title: "For New Joinees",
                desc: "Step-by-step guided form with auto-save. Fill at your own pace from any device.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Encrypted sensitive data, token-based access, and signed document URLs.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8eef5] mb-4">
                  <item.icon className="h-5 w-5 text-[#1e3a5f]" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PortalFooter />
    </div>
  );
}
