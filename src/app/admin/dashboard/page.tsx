import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminDashboard userName={session.user.name || "HR Admin"} />
    </main>
  );
}
