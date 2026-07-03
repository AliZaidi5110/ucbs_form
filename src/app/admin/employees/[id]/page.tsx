import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEmployeeWithDetails, loadFormDataForEmployee } from "@/lib/onboarding-service";
import { EmployeeDetail } from "@/components/admin/employee-detail";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const employee = await getEmployeeWithDetails(id);
  if (!employee) {
    notFound();
  }

  const formData = await loadFormDataForEmployee(employee);

  return (
    <main className="min-h-screen bg-slate-50">
      <EmployeeDetail
        employee={JSON.parse(JSON.stringify(employee))}
        formData={formData}
        userName={session.user.name || "HR Admin"}
      />
    </main>
  );
}
