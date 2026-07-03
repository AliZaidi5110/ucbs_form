import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, ClipboardList, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm text-slate-600">
            <Building2 className="h-4 w-4" />
            UCBS Human Resources
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Employee Onboarding Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            A secure, digital onboarding experience for new joinees. Complete your profile,
            upload documents, and sign acknowledgements — all in one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {[
            {
              icon: ClipboardList,
              title: "For New Joinees",
              desc: "Click Start Onboarding to enter your details and complete the multi-step form.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              desc: "Token-authenticated access with encrypted sensitive data and signed document URLs.",
            },
            {
              icon: Building2,
              title: "For HR Team",
              desc: "Manage submissions, track status, complete induction checklists, and export records.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <item.icon className="h-8 w-8 text-slate-700 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/try">
            <Button size="lg" className="w-full sm:w-auto min-w-[220px]">
              Start Onboarding (Demo)
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[220px]">
              HR Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
