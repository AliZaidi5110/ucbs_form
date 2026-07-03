import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getEmployeeByToken, loadFormDataForEmployee } from "@/lib/onboarding-service";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export default async function OnboardPage({ params }: Props) {
  const { token } = await params;
  const tokenRecord = await getEmployeeByToken(token);
  if (!tokenRecord) notFound();

  const { employee } = tokenRecord;
  const readOnly = employee.status === "SUBMITTED" || employee.status === "VERIFIED";
  const formData = await loadFormDataForEmployee(employee);

  return (
    <OnboardingWizard
      token={token}
      initialData={formData}
      readOnly={readOnly}
      status={employee.status}
      employeeName={employee.fullName}
    />
  );
}
