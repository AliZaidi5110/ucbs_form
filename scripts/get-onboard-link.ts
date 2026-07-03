import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const token = await prisma.onboardingToken.findFirst({
    where: { isActive: true },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });

  if (token) {
    console.log(`http://localhost:3000/onboard/${token.token}`);
    console.log(`Employee: ${token.employee.fullName} (${token.employee.employeeId})`);
  } else {
    console.log("No active onboarding link found. Run: npm run db:seed");
  }

  await prisma.$disconnect();
}

main();
