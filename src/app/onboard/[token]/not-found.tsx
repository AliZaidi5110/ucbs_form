import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Link Not Found</h1>
        <p className="text-slate-600">
          This onboarding link is invalid or has expired. Please contact HR for a new link.
        </p>
        <Link href="/">
          <Button variant="outline">Go to Home</Button>
        </Link>
      </div>
    </main>
  );
}
