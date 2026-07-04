"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { PortalFooter } from "@/components/shared/portal-shell";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function TryOnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, personalEmail, mobileNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start onboarding");
      router.push(data.onboardingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <BrandLogo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1e3a5f]">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Card className="shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eef5]">
                <UserPlus className="h-6 w-6 text-[#1e3a5f]" />
              </div>
              <CardTitle>Start Your Onboarding</CardTitle>
              <CardDescription>
                Enter your details to begin the guided onboarding form. Your progress saves automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As per your ID proof" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personalEmail">Personal Email *</Label>
                  <Input id="personalEmail" type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    inputMode="numeric"
                  />
                  <p className="text-xs text-slate-500">Indian mobile number starting with 6, 7, 8, or 9</p>
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 space-y-1">
                    <p>{error}</p>
                    {error.includes("Supabase") || error.includes("Missing") ? (
                      <p className="text-xs text-red-600">
                        The server may be missing Supabase environment variables. Check Vercel project settings.
                      </p>
                    ) : null}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Starting..." : "Begin Onboarding Form"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
